---
title: "From Questions to Loan Decisions: How Multi-Agent AI and MCP Work Together"
description: "Follow a student's loan journey to understand AI agents, multi-agent orchestration, MCP underwriting tools, and two extensions for institution-specific knowledge and validation."
date: 2026-10-03 05:30:00 -0400
categories: [Azure, Azure AI & Foundry]
tags: [microsoft-agent-framework, multi-agent, mcp, azure-openai, azure-container-apps, rag]
image:
  path: /assets/img/posts/student-loan-assistant-cover.png
  alt: A student's loan conversation flows through chat, document scanning, validation, and decision-making agents
toc: true
---

> Follow a student's loan journey to understand AI agents, multi-agent orchestration, MCP underwriting tools, and two extensions for institution-specific knowledge and validation
{: .prompt-tip }

> This article explains the [Agentic Loan Processing solution accelerator](https://github.com/redhatpeter/agent-loan-processing-SA), based on the [Azure Samples Multi-Agent Student Loan Assistant](https://github.com/Azure-Samples/multi-agent-student-loan-processing-SA). Student lending is the example, not a production-ready lending policy. The views expressed here are my own.
{: .prompt-info }

## Executive summary

Applying for a student loan is a conversation before it is a form: students ask questions, gather documents, confirm details, and wait for a decision. A multi-agent AI assistant can support that whole journey, but only if each part of the process has a clear owner.

In this solution, an **Orchestration Agent** guides the student and coordinates specialists: General Loan Chat for questions, a Document Extractor Agent for uploaded files, a Triage Agent for validation, and a Decision Maker Agent for the final evaluation. The Decision Maker does not invent loan terms. It calls a separate underwriting service through the **Model Context Protocol (MCP)**, which applies the business rules and returns the decision and interest rate.

Two enhancements would make the assistant more useful in a real institution: **retrieval-augmented generation (RAG)** over your own data so Q&A reflects your policies, and **authorized access to student-profile data** so the Triage Agent can validate an application against authoritative records.

This article explains what an agent is, how the workflow runs from the first question to the final decision, how MCP connects the underwriting service, and where to get the code.

## What is an AI agent?

A chatbot can answer a question. An AI agent can also use tools and application context to help carry out a task.

For this article, think of an agent as a combination of four elements:

- **A model** that interprets language and helps select an appropriate next step.
- **Instructions** that define its role, scope, and constraints.
- **Context** such as the conversation, application details, and current workflow state.
- **Tools** that let it retrieve information or invoke business operations.

For example, answering "What is a debt-to-income ratio?" is a conversational task. Reading an application, obtaining its financial values, calling a calculation service, and returning an underwriting result involves tools and a workflow.

An agent does not need unlimited autonomy to be useful. Its responsibilities and available actions should be bounded by the application.

## Why use multiple agents?

Loan processing involves different kinds of work. A student needs guidance, documents need interpretation, application information needs validation, and a business service needs to apply underwriting rules.

Instead of giving one agent every responsibility, a multi-agent design separates those tasks:

| Component | Main responsibility |
| --- | --- |
| General Loan Chat | Answer questions and explain the application process |
| Orchestration Agent | Recognize the student's intent, coordinate handoffs, and manage the conversation |
| Document Extractor Agent | Turn uploaded documents into structured application data |
| Triage Agent | Check consistency and completeness before evaluation |
| Decision Maker Agent | Invoke underwriting tools and obtain the decision |

The **Orchestration Agent** coordinates the process. The student sees one conversation, even though several specialized components contribute behind the scenes.

This does not mean that every box is an autonomous model. In the sample, [Microsoft Agent Framework](https://learn.microsoft.com/agent-framework/overview/agent-framework-overview) supports a mixture of agents and workflow executors. Narrow intent routing can use explicit patterns, while calculations and lending rules remain conventional code.

The goal is not more agents. It is clearer responsibilities.

## The loan-processing flow at a glance

The following diagram from the project shows how the student, orchestrator, specialist agents, and underwriting system connect.

![Student loan workflow: the applicant interacts with an Orchestration Agent, which supports General Loan Chat and coordinates Document Extractor, Triage, and Decision Maker agents. The Decision Maker calls an MCP underwriting system. Proprietary knowledge and Cosmos DB validation are marked as future extensions.](https://raw.githubusercontent.com/redhatpeter/agent-loan-processing-SA/main/docs/assets/multi-agent-architecture.png)
_Source: [Multi-Agent Architecture for Student Loan Processing](https://github.com/redhatpeter/agent-loan-processing-SA#multi-agent-architecture-for-student-loan-processing). The components marked "Future" are proposed extensions, not completed capabilities._

Read the main path from left to right:

**Student -> Orchestration Agent -> Document Extractor Agent -> Triage Agent -> Decision Maker Agent -> MCP underwriting service**

The branches beneath the orchestrator support general questions and future access to proprietary knowledge. The return paths show that this is not simply a one-way batch pipeline: the orchestrator remains involved in requesting information, coordinating confirmation, and communicating results.

The diagram describes responsibilities at a high level. In the current implementation, extraction is followed by triage validation, and the workflow waits for the student's confirmation before invoking the decision maker.

## Follow a student from questions to a decision

### 1. Start with general questions

A student does not necessarily arrive ready to submit an application. They may begin with:

> "What documents do I need to apply for a student loan?"
>
> "What does debt-to-income mean?"
>
> "What information should I have ready?"

The Orchestration Agent routes general questions to the conversational capability represented by **General Loan Chat** in the diagram. The assistant explains the process and helps the student understand what to prepare.

At this point, no underwriting decision is being made. The interaction is about guidance and readiness.

The current general-chat path should not be mistaken for a source of institution-verified policy. Grounding those answers in the institution's own information is the first enhancement discussed later.

### 2. Gather information and express an intent to apply

As the conversation progresses, the student gathers the necessary information and supporting documents. For this sample, the core documents are a completed loan application and a bank statement.

The student then says:

> "I have my documents ready. I'd like to apply for a student loan."

This expresses an **application intent**. The orchestrator moves from general guidance into the application process and asks the student to upload the required files.

Recognizing intent is not the same as having enough information to act. The orchestrator can begin the application conversation immediately, but document extraction requires the documents to be available.

### 3. Invoke the Document Extractor Agent

After the student uploads the PDFs, the orchestrator invokes the **Document Extractor Agent**.

The [document-scanning implementation](https://github.com/redhatpeter/agent-loan-processing-SA/blob/main/src/backend/app/services/loan_document_scanner.py) converts PDF content to Markdown with PyMuPDF4LLM and uses Azure OpenAI to extract structured records. Separate data models represent the application and the bank statement.

Relevant information includes:

- student number and applicant name
- requested loan amount
- gross monthly income and monthly debt payments
- bank name and account details
- bank-statement account-holder information

The important change is from **document text** to **fields that software can process**. The assistant can display those fields for review instead of presenting only a document summary.

Structured output helps keep the result in the expected format. It does not guarantee that the values were read correctly, which is why the next stage matters.

### 4. Validate with the Triage Agent

The **Triage Agent** checks whether the extracted information is consistent and complete enough to proceed.

For example:

- Does the applicant name agree with the bank-statement account holder?
- Do the bank names and the last four account-number digits match?
- Are the required financial fields present?
- Do the values meet the expected format and sign requirements?

The [current triage implementation](https://github.com/redhatpeter/agent-loan-processing-SA/blob/main/src/backend/app/agents/loan_workflow/loan_application_validator.py) uses model-based validation instructions and also includes deterministic validation helpers. A validation response is useful evidence, not proof that the documents are authentic or the applicant's identity has been independently verified.

If information is missing or inconsistent, the assistant reports the problem so the student can clarify or provide corrected documents. A failed validation should not be presented as a completed lending decision.

If validation passes, the workflow shows the information and asks the student to confirm before evaluation:

> "Please review the extracted details and confirm that you want to proceed."

This keeps the student involved at the boundary between interpreting documents and submitting information for a decision. Confirmation of the data is not, by itself, human approval of the loan.

### 5. Ask the Decision Maker Agent to obtain underwriting results

After confirmation, the orchestrator passes the consolidated information to the **Decision Maker Agent**.

Despite its name, this agent is not supposed to invent a loan amount or interest rate. It connects to the underwriting service through MCP and invokes the available business tools.

The distinction is important:

> The agent coordinates the request. The underwriting service executes the lending rules.

The service returns a structured result, and the application presents the decision, requested loan amount, applicable annual percentage rate (APR), and explanation to the student.

### 6. Return the result through the conversation

The orchestrator closes the loop by communicating the result and next steps. The student does not need to know which specialist handled each stage.

An illustrative journey looks like this:

| Student interaction | System response |
| --- | --- |
| "What do I need to apply?" | Explain the required documents and information |
| "I'm ready to apply." | Begin the application process and request uploads |
| Upload the application and bank statement | Extract fields and run consistency checks |
| Review the information and confirm | Submit the validated information for evaluation |
| Wait for the outcome | Return the underwriting result and explanation |

The interface also streams responses and exposes processing status so the student can distinguish document extraction, validation, and evaluation from an unresponsive application.

## What is MCP, and what does it do here?

**Model Context Protocol (MCP)** is a standard for connecting AI applications to external capabilities and context. In this project, its most relevant capability is exposing **tools**: named operations with descriptions and structured inputs that the application can discover and invoke.

The [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) distinguishes three roles:

| MCP role | Role in the loan-processing solution |
| --- | --- |
| Host | The AI application running the loan workflow |
| Client | The integration that connects the application to the underwriting server |
| Server | The service exposing loan-evaluation tools |

The diagram's **"MCP Underwrite Loan Approved System"** is the underwriting service acting as an MCP server. It is a business service, not another conversational agent.

### From discovering tools to receiving a result

The interaction follows this sequence:

1. **Connect:** the Decision Maker Agent's MCP integration connects to the server and initializes the protocol session.
2. **Discover:** the client obtains the available tool definitions, including names, descriptions, and input schemas.
3. **Invoke:** the agent requests a tool call with the relevant application values.
4. **Execute:** the server validates the tool inputs and runs its business logic.
5. **Return:** the client receives the tool result, which the application uses to complete the workflow.

MCP standardizes these exchanges. It does not supply underwriting policy, guarantee correct tool selection, or replace authorization and business validation.

### The underwriting tools in this sample

The [MCP server code](https://github.com/redhatpeter/agent-loan-processing-SA/blob/main/src/biz_api/loan_approval/mcp_tools.py) exposes two tools used by the decision workflow:

- **`calculateDTI`** calculates debt-to-income ratio from gross monthly income and monthly debt payments.
- **`evaluateLoanApplication`** evaluates the application and returns a decision and applicable APR.

The decision-maker instructions specify calculating DTI first, then evaluating the application.

```text
Validated application + student confirmation
        |
        v
Decision Maker Agent
        |
        | MCP client: calculateDTI
        v
Underwriting MCP server -> DTI result
        |
        | MCP client: evaluateLoanApplication
        v
Underwriting MCP server -> decision, APR, amount, reason
        |
        v
Orchestrator -> student-facing response
```

The [current business rules](https://github.com/redhatpeter/agent-loan-processing-SA/blob/main/src/biz_api/loan_approval/services.py) are intentionally simple:

| DTI | Sample underwriting result |
| --- | --- |
| Below 40% | Approved at 5.5% APR |
| 40% through 45% | Approved at 7.5% APR |
| Above 45% | Rejected |

For an illustrative calculation, $1,000 in monthly debt payments divided by $4,000 in gross monthly income produces a DTI of 25%. Under these sample rules, that falls into the 5.5% APR category.

**These are demonstration rules, not real lending advice or institutional policy.** The implementation evaluates the application using DTI and includes the **requested amount** in the result; it does not independently calculate a maximum eligible loan amount. A fuller underwriting service could determine approved amounts and rates using additional authorized data and policies.

Keeping those rules in a separate service makes them easier to test and version. MCP provides the connection to that service; the language model should not substitute its own financial terms.

## Two enhancements that make the solution more useful

The diagram explicitly marks two areas for future development. They address different needs: reliable answers from institutional knowledge, and validation against authoritative student records.

### Enhancement 1: Use RAG for questions about your own data

**Retrieval-augmented generation (RAG)** grounds a model's answer in information retrieved for the current question. Instead of relying only on the model's general knowledge, the application first looks up relevant material from an approved source.

For loan-related Q&A, that source might contain:

- the institution's loan-product descriptions
- application requirements and document checklists
- repayment policies and published terms
- approved FAQs and support guidance

Following the [RAG pattern](https://learn.microsoft.com/azure/foundry/concepts/retrieval-augmented-generation), an extension could work like this:

```text
Student asks a policy question
    -> Retrieve relevant approved content
    -> Provide the question and retrieved passages to the model
    -> Generate a grounded answer with source citations
```

Azure AI Search is one possible retrieval service. The implementation would need to keep indexed content current, preserve source references, and restrict retrieval to information the student is permitted to access.

This gives the diagram's **Proprietary Data (Future)** component a concrete purpose: answering "What does our institution require?" rather than only "What do student loans generally involve?"

If the retrieved evidence is missing or conflicting, the assistant should acknowledge the gap instead of inventing policy.

### Enhancement 2: Give the Triage Agent authorized access to student profiles

Matching two documents establishes consistency between those documents. It does not establish that they agree with the institution's records.

The second enhancement connects the Triage Agent to an authorized student-profile API or database. The diagram names **Cosmos DB (Future)**, but the authoritative information could reside in an existing student information system or another approved data store.

Subject to institutional policy, the validator could check:

- whether the student number resolves to an existing profile
- whether the applicant name agrees with the official record
- whether enrollment status satisfies the relevant requirements
- whether an existing application requires duplicate handling or review

The lookup should use the authenticated applicant's authorized identity and explicit matching rules, not grant access merely because someone supplies a student number. Missing or conflicting records should trigger clarification or review, not silent acceptance.

This capability belongs behind a protected, narrowly scoped interface. The agent does not need unrestricted database access to validate an application.

The two enhancements complement each other:

| Enhancement | Question it helps answer |
| --- | --- |
| RAG over approved institutional content | "What are our requirements and policies?" |
| Authorized student-profile lookup | "Does this application agree with this student's authoritative record?" |

Neither enhancement is implemented simply because it appears in the architecture diagram.

## Keep the production boundary clear

The accelerator demonstrates a useful pattern, but a real lending system needs more than a successful conversation.

Before production, teams should establish durable workflow state, deterministic enforcement of critical rules, secure file processing, least-privilege tool access, and privacy-conscious audit records. They should evaluate extraction errors, mismatched documents, tool failures, and decision consistency, not only the quality of generated language.

Real lending also requires approved underwriting policy, appropriate legal and fair-lending review, and human review or appeal paths. The sample's DTI thresholds and conversational confirmation are not substitutes for those controls.

## Hands-on implementation

To explore the code and install the solution, see the [redhatpeter/agent-loan-processing-SA](https://github.com/redhatpeter/agent-loan-processing-SA) repository and its README. The [installation guidance](https://github.com/redhatpeter/agent-loan-processing-SA#installation) and [running instructions](https://github.com/redhatpeter/agent-loan-processing-SA#running-the-application) cover the configuration and the three parts to start:

- the **backend** that hosts the Orchestration, Document Extractor, Triage, and Decision Maker agents
- the **MCP business service** that exposes the underwriting tools
- the **front-end chat application**

You need Python 3.11+, Node.js 18+, an Azure OpenAI account with a GPT-4o deployment, and an Azure Blob Storage account for uploaded documents.

A practical way to start:

- Use a development subscription and synthetic documents only.
- Review the storage-account settings the README requires for local testing before applying them, and do not reuse them for real data.
- Run the happy path first, then try a missing field, a mismatched bank statement, and DTI values near each threshold.

## Closing

The value of this multi-agent design is the division of responsibility.

General Loan Chat helps the student prepare. The Orchestration Agent recognizes intent and coordinates the process. The Document Extractor Agent turns files into structured information. The Triage Agent checks that information. The Decision Maker Agent uses MCP to obtain an underwriting result from a separate business service.

RAG could make the guidance institution-specific, while authorized profile lookup could strengthen validation. Together, these additions would connect the conversation to both the organization's knowledge and its authoritative records.

Student lending is the example. Adapting the pattern to another loan product requires its own documents, schemas, validation rules, and underwriting policies.

> **Use agents to interpret and coordinate, tools to execute controlled business operations, and explicit workflows to keep the process understandable.**
