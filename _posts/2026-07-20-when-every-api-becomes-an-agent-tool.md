---
title: "When Every API Becomes an Agent Tool: Why MCP Governance Matters"
description: "How to reduce tool confusion, token waste, and wrong actions with a gateway-centric control plane"
date: 2026-07-20 00:01:00 -0400
categories: [AI, AI Agents]
tags: [mcp, governance, azure-apim, ai-agents, llm]
image:
  path: /assets/img/posts/mcp-governance-cover.png
  alt: MCP governance turns a noisy tool space into a canonical agent tool surface
toc: true
---

> How to reduce tool confusion, token waste, and wrong actions with a gateway-centric control plane
{: .prompt-tip }

## Executive summary

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro) is making it much easier to connect AI agents to enterprise tools, APIs, and workflows. That is good news for capability, but it also creates a new governance problem: agents choose tools from machine-readable catalogs, not from human judgment. If tool names collide, meanings overlap, schemas drift, or too many tools are exposed at once, the agent can confidently choose the wrong tool.

This is not just a documentation issue. It is an accuracy, cost, security, and runtime control problem.

The answer is not simply “better naming.” Enterprises need an MCP governance model with two connected parts: a **governance plane** that validates and deduplicates tools before publication, and a **runtime plane** that filters, rewrites, and secures the tool surface the agent actually sees. MCP gives us the protocol. Governance makes that protocol usable at enterprise scale.

## The problem you have not scheduled yet

Enterprises already know how to govern APIs for human developers: document them, version them, secure them behind gateways, and add review processes. But AI agents change the operating model.

With MCP, the consumer is no longer a human reading documentation and carefully choosing an API. The consumer is an agent that asks what tools are available, reads their names, descriptions, and schemas, and decides which one to call on its own. MCP is an open standard for connecting AI applications to external systems such as tools, data sources, and workflows. In the MCP server model, tools are discoverable and callable by language models through structured protocol operations.

That sounds straightforward until an enterprise starts exposing a large API estate as MCP tools. [Azure API Management now supports exposing managed REST APIs as remote MCP servers](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview), where API operations become MCP tools, and APIM policies can be used to govern access, authentication, and runtime behavior for those tools.

This is where the governance problem begins.

As more APIs are surfaced as MCP tools, agents face a larger and noisier decision surface. [Microsoft Research describes this broader failure pattern as **tool-space interference**](https://www.microsoft.com/en-us/research/blog/tool-space-interference-in-the-mcp-era-designing-for-agent-compatibility-at-scale/): otherwise reasonable tools can reduce end-to-end effectiveness when they are co-present, leading to longer action sequences, higher token cost, brittle recovery, and task failure.

So the real enterprise question is no longer just:

> **How do we expose more tools?**

It is:

> **How do we help the agent see the right tools, understand them correctly, and choose the best one safely and consistently?**

## What MCP is, in practical terms

At a practical level, MCP is the protocol layer between an AI agent and external capabilities.

Two MCP operations tell most of the story:

- tools/list — the client asks what tools are available

- tools/call — the client invokes a selected tool by name

In the MCP specification, tools are model-controlled: a language model can discover and invoke them automatically based on prompt context. [A tool definition](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) includes a unique name, a human-readable description, and an inputSchema, and MCP explicitly recommends keeping a human in the loop for trust, safety, and approval of tool invocations.

That means the agent is making decisions from what the server advertises. If the names are weak, the descriptions are vague, the schemas overlap, or too many tools are exposed at once, the model has to guess.

MCP gives us the transport and interaction model. It does **not** automatically solve naming discipline, duplicate detection, tool quality, or runtime filtering. That is why MCP governance becomes necessary.

## Why this becomes a governance problem so quickly

The main difference between a traditional API catalog and an MCP catalog is that an API catalog is usually interpreted by humans, while an MCP catalog is interpreted first by models.

A developer can look at three similar APIs, read the docs, ask another engineer, and usually figure out which one to use.

An agent cannot do that reliably.

It sees a list of tools and tries to infer intent from the tool name, the description, the schema, the user prompt, and the other tools currently available. That makes tool catalog quality directly relevant to:

- selection accuracy

- wrong-action risk

- hallucination resistance

- token cost

- auditability

[OpenAI’s current function-calling guidance](https://developers.openai.com/api/docs/guides/function-calling) makes the same point from the model side: keep the number of initially available functions small for higher accuracy, aim for fewer than 20 at the start of a turn when possible, and use tool search or deferred loading instead of exposing a large tool surface up front. OpenAI also notes that function definitions count against context limits and are billed as input tokens.

So governance is not only a design-time publishing discipline. It is also a runtime optimization strategy.

## The five failure patterns that appear as MCP catalogs grow

### 1. Name collisions

This is the easiest problem to recognize.

Different teams publish tools that represent the same capability under slightly different names:

- createCustomer

- CreateCustomer

- customer_create

- CustomerAPI_Final_v3

To a human reviewer, those look suspiciously similar. To an agent, they may look like multiple valid options. The dangerous part is that the wrong choice does not necessarily fail loudly. The wrong tool can still execute.

### 2. Semantic duplicates

This is more subtle.

The names are different, but the behavior overlaps:

- customer.find

- customer.search

- customer.lookup

All three may retrieve customer data, but what is the actual distinction? Is one fuzzy search? Is one exact match? Is one ID lookup? If the difference is not obvious in the metadata, the agent may choose the “almost right” tool instead of the best one. [This is exactly the kind of ambiguity that makes tool-space interference worse](https://www.microsoft.com/en-us/research/blog/tool-space-interference-in-the-mcp-era-designing-for-agent-compatibility-at-scale/).

### 3. Tool overloading and schema drift

This is one of the most dangerous problems because the names sound similar even when the contracts are no longer the same.

Suppose the agent sees these tools:

- invoiceCreate

- invoiceCreateV1

- invoiceCreateLegacy

A user asks:

“Create an invoice for Contoso for $12,000 due next month.”

To a human, all three tools sound related. To an agent, all three may look like plausible matches.

But under the hood, the schemas may have drifted:

invoiceCreate might expect:

```json
{
"customerId": "C123",
"amount": 12000,
"currency": "USD",
"dueDate": "2026-08-01"
}
```

invoiceCreateLegacy might expect:

```json
{
"accountNumber": "A7788",
"invoiceTotal": 12000,
"paymentTermsCode": "NET30"
}
```

Now the problem is not just naming. The schemas and business meaning have diverged over time. So even if the agent understands the user’s intent correctly, it can still call the wrong version, send the wrong payload, hit validation errors, or, worst case, trigger a successful but incorrect business action.

That is what tool overloading and schema drift look like in practice.

### 4. Ungrouped tools and flat namespaces

This becomes clear with one simple example.

Imagine an enterprise exposing tools with names like:

- create

- lookup

- list

- update

Now imagine that enterprise spans finance, claims, HR, procurement, and customer support.

If the agent sees a tool called create, what should it infer? Create customer? Create invoice? Create case? Create employee? Create vendor?

Humans can often resolve that ambiguity through context and tribal knowledge. Agents cannot.

Now compare those flat names with domain-aware names:

- finance_invoice_create

- customer_profile_lookup

- claims_case_list

- hr_employee_update

Those names carry much stronger disambiguation signals. Flat namespaces are not just a style problem. They are a tool-selection problem.

### 5. Gateway naming drift in Azure APIM

This issue is specific to the gateway path and is easy to overlook.

In my APIM-based testing, I observed that the tool name seen by the agent at runtime did not always exactly match the authored API operation name. For example, an operation authored as finance_quote_get appeared to the agent as financeQuoteGet. I did not find a APIM reference page that explicitly documents this exact normalization rule, so this example should be treated as an **observed APIM runtime behavior in our testing**, not as a formally documented naming algorithm. Microsoft Learn does confirm that when APIM exposes a managed REST API as an MCP server, [it **creates the MCP server and exposes the selected API operations as tools**](https://learn.microsoft.com/en-us/azure/api-management/export-rest-mcp-server?utm_source=chatgpt.com), and that those exposed operations are managed through the MCP server’s **Tools** blade.

That means one business capability can effectively end up with three identities:

The problem is not cosmetic. It becomes operational very quickly.

Imagine the API team authored a tool as finance_quote_get, but the agent only ever sees and calls financeQuoteGet because APIM **normalized** the name at runtime in our testing. If your governance policy or duplicate-resolution map is keyed only on the authored name, it may fail to match the actual tool call. As a result, alias suppression, rewrite logic, telemetry correlation, and policy enforcement can all miss the intended tool even though it represents the same business capability.

A simple example makes this clearer:

- The API designer publishes an operation named finance_quote_get.

- APIM exposes that operation as an MCP tool and, in our testing, **normalizes** the runtime tool name to financeQuoteGet.

- The agent sees financeQuoteGet in tools/list and uses that same name in tools/call.

- The governance layer tracks the canonical identity as governed-mcp__financeQuoteGet.

- If a policy matches only finance_quote_get, it will miss the runtime call and fail to filter or rewrite it correctly.

This is why gateway naming drift is not just a naming hygiene problem. It is an **identity-mapping problem**. In an APIM-centered MCP architecture, the gateway is where authored identity, runtime identity, and governance identity must be reconciled. That is one of the reasons a canonical map and runtime rewrite/filter layer are needed. Rather than hard-coding APIM's normalization rule, the governance layer resolves the runtime wire name directly from APIM's own published mcpTools metadata (properties.mcpTools[*].{name, operationId}), so the canonical map always keys on the exact name the agent will call.

## The solution in one paragraph

A workable MCP governance solution needs two connected parts:

- a **governance plane** that validates, deduplicates, classifies, and canonicalizes tools before publication

- a **runtime plane** that decides what the agent actually sees and how tool invocations are normalized, filtered, secured, and observed at runtime

In other words, governance should not end when a tool is published. It should continue all the way through discovery and invocation.

## How to read the architecture

The architecture below makes this idea concrete by splitting the system into a **Runtime Plane** and a **Governance Plane**. The diagram shows APIM sitting at the center of the runtime path, with a governed MCP surface and a messy MCP surface exposed side by side. It also shows three governance layers—L1, L2, and L3—feeding the runtime behavior through a canonical map stored in Cosmos DB.

![MCP governance architecture: runtime plane and governance plane](/assets/img/posts/mcp-governance-architecture.png)
_High-level architecture: APIM at the center of the runtime plane, with L1/L2/L3 governance layers feeding a canonical map in Cosmos DB._

## Runtime Plane: what the agent sees

At the top of the diagram, the user interacts with a frontend chat UI, which communicates with APIM. APIM exposes two MCP surfaces:

- governed-mcp

- messy-mcp

That is an intentional design choice because it makes the difference visible. The same backend REST APIs can be exposed through both a governed and an ungoverned surface, which allows teams to compare agent behavior side by side. In this runtime plane, APIM is the enforcement point between the agent-facing tool surface and the backend systems.

This is also where APIM’s MCP support matters operationally. [APIM can expose REST APIs as MCP servers](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview), that API operations become MCP tools, and that policies can be applied across those tools to control access, authentication, quotas, filtering, and other runtime concerns. APIM also supports securing both inbound access from MCP clients and outbound access to backends.

## Governance Plane: how the catalog is prepared

The lower half of the diagram is the governance plane. This is where tool quality is improved before the agent ever sees the catalog.

The design uses three layers:

#### L1 — Schema and naming lint

GitHub Actions acts as the first gate. This is where tool definitions are checked for naming quality, schema quality, and obvious publishing policy violations before they move forward. At this layer, the linter explicitly checks naming rules, collisions, banned version markers, and missing disambiguation guidance.

#### L2 — Duplicate resolution

A Dup-Resolver service pulls descriptors, embeds and compares tools, detects similarity, elects canonical identities, and writes a canonical_map into Cosmos DB. In the fuller pattern, Azure OpenAI is used for embeddings and Azure AI Search is used for similarity and vector-based matching. API Center appears as the longer-term system-of-record direction, though not in the PoC path.

#### L3 — Runtime enforcement

At runtime, APIM reads the canonical map and applies policies that filter what appears in tools/list, normalize tool identity for runtime matching, and rewrite aliases during tools/call. This is the architectural move that turns governance into an active runtime control rather than passive documentation.

That leads to the central thesis:

A real MCP governance solution needs both a governance plane and a runtime plane. The governance plane improves the quality of the catalog. The runtime plane improves the quality of the agent’s decision context.

## The L1, L2, L3 model in plain English

A simple way to explain the architecture is this:

- **L1 prevents bad tools from entering the catalog.**

- **L2 decides which tools are really the same capability.**

- **L3 makes the runtime experience safer for the agent.**

That framing is easy for both architects and engineers to follow, and it matches the behavior shown in current PoC materials.

## A simple end-to-end flow

Here is the end-to-end request story:

- A tool admin proposes a new or updated tool descriptor.

- L1 checks naming, schema quality, and obvious collisions.

- L2 compares the tool against the broader catalog, detects duplicates or aliases, and elects a canonical identity.

- The canonical mapping is written into Cosmos DB.

- At runtime, APIM uses that map to filter duplicate tools out of tools/list.

- If a caller uses an alias during tools/call, APIM rewrites it to the canonical tool before forwarding the request.

That is the difference between a static registry and a real governance control plane.

## Why this lowers hallucination, reduces token cost, and improves accuracy

A mature MCP governance platform creates value in three practical ways.

### Lower hallucination risk

When the visible tools are clearly named, de-duplicated, and mapped to canonical identities, the model has less room to guess. Ambiguous tools do not guarantee hallucination, but they make hallucination-like selection behavior much more likely. Microsoft Research’s framing of tool-space interference is useful here because it links noisy co-present tools directly to longer action sequences, brittle recovery, and task failure.

### Better token efficiency

OpenAI’s guidance is explicit: keeping the number of initially available functions small improves accuracy and reduces context pressure. Function definitions count against the model’s context limit and are billed as input tokens, so reducing noise and loading only relevant tools improves both cost and quality.

### Higher action accuracy

When runtime policy filters aliases and rewrites requests toward canonical tools, the agent is less likely to choose an outdated, overloaded, or semantically wrong action surface. That improves the odds that the correct business action is taken the first time. This is one of the key promises of the governed-versus-messy comparison.

## Why MCP governance is also a security control

This part deserves to be explicit.

MCP governance is not just about naming and accuracy. It is also about secure access to action-capable tools.

In an enterprise environment, a governance layer should help enforce:

- least-privilege access to tool surfaces

- environment and tenant scoping

- authentication and authorization policy

- observability and audit trails for discovery and invocation

- separation between read-only tools and side-effecting tools

This is another reason the gateway matters. [Microsoft’s APIM guidance for MCP](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview) specifically calls out centralized control over authentication, authorization, monitoring, observability, rate limiting, and secure inbound and outbound access for MCP servers and their backends.

If agents are going to call business tools, governance has to include security, not just naming conventions.

## Why this gets harder in multi-cloud environments

This problem becomes even more serious when MCP servers and APIs are spread across multiple teams, gateways, and clouds.

In a multi-cloud environment, organizations often end up with:

- different publication paths

- different naming habits

- different identity systems

- different security controls

- multiple versions of the same business capability

Without a shared governance model above those boundaries, the enterprise does not really have one MCP platform. It has several disconnected MCP islands that happen to speak the same protocol. This risk broadens the discussion from APIM mechanics to enterprise platform strategy.

A real governance solution must normalize tool identity, metadata, policy, and runtime presentation across those boundaries.

## Why the gateway is the right control point

This is the most important architectural recommendation in the article.

If every team solves naming, deduplication, aliasing, and filtering inside its own MCP server, governance becomes fragmented and inconsistent.

But if the gateway is the MCP exposure point, the organization can govern once and enforce consistently.

That is why APIM is so important in this pattern:

- it is already where enterprise APIs are managed

- it can expose REST operations as MCP tools

- it can apply centralized policy

- it can secure both client-to-gateway and gateway-to-backend access

- it can become the runtime enforcement point for canonical identities and filtered tool surfaces

So the architectural recommendation is simple:

> **Govern once at the gateway, rather than trying to fix every MCP server independently.**

## Hands-on implementation

For a hands-on reference implementation, see the [redhatpeter/mcp-tool-governance repo](https://github.com/redhatpeter/mcp-tool-governance) and its README. That repo is the source of truth for the L1/L2/L3 workflow, the governed-versus-messy MCP surfaces, and the runtime rewrite/filter pattern implemented at the gateway. It also includes concrete implementation details such as lint checks, duplicate-resolution flow, canonical mapping, and demo/evaluation entry points.

A practical rollout path is:

- Start with L1 in CI so the catalog stops getting worse.

- Add L2 in observe-only mode so duplicate patterns become visible.

- Enable L3 gradually by domain so list filtering and alias rewrite can be measured safely in production-like conditions.

## Closing

MCP is becoming the interface layer between agents and enterprise actions. That makes tool quality, identity, runtime presentation, and secure access first-class architecture concerns.

As more APIs are exposed as MCP tools, the risk is no longer only integration complexity. The risk is that the agent sees too many similar tools, chooses the wrong one, and acts with confidence on ambiguous inputs.

That is why enterprises need MCP governance now: not just to publish tools, but to make them clear, canonical, secure, and easy for agents to select correctly.

The organizations that win in the MCP era will not be the ones that publish the most tools. They will be the ones that publish tools an agent can actually understand and use safely.
