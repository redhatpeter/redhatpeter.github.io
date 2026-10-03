---
title: "Who Is Really Calling Your Backend? Copilot Studio Identity, Permissions, and Audit"
description: "Understand how agent identities, connection credentials, backend permissions, and audit evidence work together in Copilot Studio"
date: 2026-10-03 07:00:00 -0400
categories: [AI, AI Agents]
tags: [copilot-studio, entra-agent-id, ai-agents, governance, authorization, audit]
image:
  path: /assets/img/posts/copilot-studio-agent-security-cover.png
  alt: A request crosses user, agent, connection, and backend layers, with the connection identity determining the caller seen by the backend
toc: true
---

> Understand how agent identities, connection credentials, backend permissions, and audit evidence work together in Copilot Studio
{: .prompt-tip }

> This article adapts a Copilot Studio security architecture slide deck and checks key product details against Microsoft's documentation on [agent identities](https://learn.microsoft.com/microsoft-copilot-studio/govern-agents-identities-overview) and [connection credentials](https://learn.microsoft.com/microsoft-copilot-studio/configure-no-maker-authentication). The architecture examples and validation steps are guidance to evaluate, not a tested deployment or production certification. The views expressed here are my own.
{: .prompt-info }

## Executive summary

Building a Copilot Studio agent that answers questions is one thing. Allowing it to retrieve restricted documents, invoke enterprise APIs, or update business records is another. Once an agent can take action, knowing that it has an identity is not enough. We also need to know which identity each tool uses and what the backend allows that caller to do.

The key distinction is between **agent identity** and **authorization**. An agent can have its own Microsoft Entra Agent ID while one tool uses the end user's connection and another uses a connection configured by the maker. Those choices can produce different permissions and different audit records.

This article follows a request across those boundaries, compares three connection patterns, and explains how central policy and cross-system audit evidence fit together. It closes with a practical validation approach for proving that an agent operates within its intended permissions.

## Start with the request, not the directory entry

An **AI agent** combines a model, instructions, context, and tools to help carry out a task. In Copilot Studio, a **tool** exposes an action the agent can invoke; a **connector** provides an integration with another service. A **connection** supplies the authentication configuration used for that integration.

Two more terms matter: **authentication** establishes who the caller is; **authorization** determines what that caller may do.

Consider a fictional employee asking an agent to retrieve a restricted project document. The request crosses several layers:

```text
Employee asks for a document
    |
    v
Copilot Studio agent selects a tool
    |
    v
Connector authenticates using its configured connection
    |
    v
Backend authorizes the request and returns or denies the document
```

The employee initiates the request. The agent selects the action. The connection establishes the downstream caller. The backend enforces access to the document.

Those responsibilities do not imply a single identity flowing unchanged through every layer.

| Layer | Question to answer |
| --- | --- |
| User or event | Who or what initiated the action? |
| Copilot Studio agent | Which agent orchestrated the request? |
| Tool and connection | Which credentials authenticate the downstream call? |
| Backend service | What can the authenticated caller actually do? |

A directory entry answers an important identity question. It does not, by itself, answer the authorization question for every tool.

> **An agent's identity does not automatically define its backend authorization boundary.**

## What an agent identity gives you

[Microsoft's agent identity documentation](https://learn.microsoft.com/microsoft-copilot-studio/govern-agents-identities-overview) describes automatic Entra Agent ID provisioning for newly created Copilot Studio agents. Legacy agents can still use app registrations, so administrators should verify the identity model of the agent they are reviewing.

For Entra Agent IDs, a Microsoft-managed blueprint creates and manages agent identities using federated identity credentials. Makers do not need to create client secrets for that platform identity. This is not a promise that every downstream connector is credential-free: connections can have their own authentication requirements and credential lifecycle.

The identity model also supports human accountability. For Entra Agent IDs, the agent owner is added as a **sponsor**, with more limited permissions than a full identity owner. Legacy identities and some preexisting agents can differ.

These capabilities help administrators locate agents, review authentication activity, and manage their lifecycle.

However, the permissions visible on the identity need careful interpretation. Microsoft explains that the API scopes attached when an agent is published represent **connector access**. They are not automatically raw backend permissions such as Microsoft Graph `Mail.Read` or `Files.Read.All`.

Seeing a connector listed on the agent identity is useful evidence. It does not establish which documents, rows, or business operations the backend will allow.

## Three connection patterns, three different boundaries

A single agent can use more than one connection pattern. Review the authentication mode of each tool, including the connections used inside any downstream flow.

### End-user authentication

With end-user authentication, the tool uses the user's authenticated connection. The backend evaluates that user's permissions.

![End-user authentication: an employee's request passes through the agent and a tool using the user's connection, while the backend enforces that user's permissions.](/assets/img/posts/copilot-pattern-end-user.png)
_Connection pattern 1: The requesting user's permissions define the backend access boundary. This diagram illustrates the pattern, not a tested deployment._

For the fictional document request, the intended behavior is straightforward: an employee who lacks access to the document should not gain access simply by asking the agent.

This is generally the preferred starting point for user-specific sensitive information. It aligns the tool's access with the requesting user's rights.

There are two qualifications:

- Signing in to the agent does not, by itself, prove that every downstream tool uses the same user's connection.
- Acting "on behalf of a user" does not necessarily mean that a connector implements the specific OAuth on-behalf-of token exchange. Verify the actual authentication mechanism.

Backend logs may identify the user as the effective caller. Additional evidence may be needed to distinguish an agent-mediated action from a direct action by that user.

### Maker-provided connections

In this pattern, the agent uses a connection configured by its maker rather than the requesting user's connection.

![Maker-provided connections: an employee's request passes through the agent and a tool using the maker's connection, which can expose capabilities beyond the employee's own permissions.](/assets/img/posts/copilot-pattern-maker-provided.png)
_Connection pattern 2: The backend enforces the maker-provided connection's permissions. Shared access must be intentional and governed._

This can be appropriate for deliberately shared capabilities, such as reading information approved for the agent's entire audience. But the connection may belong to a person or another configured account. It is not automatically a dedicated service identity.

The main risk is oversharing. [Microsoft explicitly warns](https://learn.microsoft.com/microsoft-copilot-studio/configure-no-maker-authentication) that users may retrieve information or perform actions through the agent that only the maker's account is permitted to access.

Return to the document example. If the maker's connection can read the restricted document, the employee's own lack of access may no longer be the boundary enforced by that backend call.

Before choosing this pattern, establish:

- Whether every intended agent user is authorized to exercise the exposed capabilities.
- Whether the connection has only the permissions those capabilities require.
- How the connection is maintained, reviewed, and revoked.
- Which identity appears in the backend's audit records.

If users require different permissions, use a suitable per-user connection model or enforce explicit authorization in a trusted backend. Prompt instructions are not an access-control mechanism.

### Workload or service identity

Scheduled and event-driven processing may need a non-human identity rather than a live user session.

![Workload or service identity: a scheduled event triggers an agent or workflow that accesses an enterprise system through a protected API or gateway, using a supported non-human identity.](/assets/img/posts/copilot-pattern-workload-identity.png)
_Connection pattern 3: A proposed architecture for non-interactive processing. Validate the supported authentication path and actual backend principal; the diagram does not imply universal connector support._

This is a **scenario-dependent design pattern**, not a guarantee that every Copilot Studio connector can call every backend using the agent's Entra Agent ID.

Validate the authentication path supported by the platform, connector, and target system. Identify the principal the backend actually receives and give it only the permissions required for the workload. If the implementation uses a separate service identity, document it separately from the agent's platform identity.

A gateway can provide a place to validate credentials and enforce API policy. It does not automatically create an authorization model or preserve the initiating user's identity.

For consequential actions, add explicit business controls such as approval requirements and narrowly scoped operations.

### Choosing a starting point

| Requirement | Starting pattern | What must be verified |
| --- | --- | --- |
| Read user-specific restricted data | End-user authentication | The backend enforces the requesting user's permissions |
| Access information approved for every agent user | Maker-provided connection, where appropriate | Shared permissions are intentional, limited, and governed |
| Run without an interactive user | Supported workload or service identity | The complete non-interactive authentication path works |
| Mediate custom enterprise APIs | An appropriate identity pattern plus a protected gateway | Caller validation and backend authorization are explicitly implemented |

The gateway is an integration component, not a substitute for choosing the correct identity pattern.

## Central policy complements backend authorization

Several controls can govern the same request, but they answer different questions.

[Power Platform data policies](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention) and [advanced connector policies](https://learn.microsoft.com/power-platform/admin/advanced-connector-policies) govern connector use. Microsoft Entra controls govern supported authentication scenarios. The backend remains responsible for authorizing access to its resources.

| Control layer | Core question |
| --- | --- |
| Environment and connector governance | Is this agent allowed to use this connector? |
| Authentication policy | Is this identity allowed to authenticate in this context? |
| Connection configuration | Which identity is presented downstream? |
| Backend authorization | May this caller access this record or perform this action? |

Channel support matters. As documented when this draft was prepared on October 3, 2026, [agent-identity connector scope enforcement, including Conditional Access on that identity, applies to Microsoft Teams](https://learn.microsoft.com/microsoft-copilot-studio/govern-agents-identities-overview#security-and-permissions). Other channels use the existing Power Platform connector authentication flow for these calls. This limitation concerns that specific agent-identity enforcement path, not every possible Conditional Access policy in the wider system. Recheck support for the deployment channel before relying on it.

Administrators can also [restrict maker-provided credentials at the environment or environment-group level](https://learn.microsoft.com/microsoft-copilot-studio/configure-no-maker-authentication). This is not merely an authoring preference: it changes runtime behavior.

Microsoft warns that requiring end-user credentials can break scheduled or autonomous execution when no active user is available. Inventory affected agents and flows before applying the policy.

## Audit the action, not just the sign-in

"The agent has a sign-in record" is not the same as "We can explain the business action."

For the fictional document request, an investigation may need to establish which user initiated it, which agent selected the tool, which connection authenticated, and whether the backend returned or denied the document.

Plan to correlate evidence across systems:

| Evidence source | What to establish |
| --- | --- |
| Microsoft Entra | Identity and relevant authentication activity |
| Copilot Studio, Power Platform, and Microsoft Purview | Available configuration, governance, and execution evidence |
| API gateway or integration service | Validated caller context, routing, request identifiers, and policy decisions |
| Backend service | Effective caller, operation, affected resource, and outcome |

This table is an audit design checklist, not a claim that every product emits every field by default. Verify event availability, diagnostic settings, licensing, retention, and access to logs in the actual deployment.

Where supported, carry a request or trace identifier through the integration. Record the agent, initiating user or event, effective connection identity, target operation, and result.

A correlation ID helps connect records. It does not prove identity. Security decisions must rely on validated authentication context, not caller-supplied labels.

Protect the audit trail itself. Avoid recording access tokens, secrets, or unnecessary sensitive conversation content.

## Validate the boundary before production

The following is a proposed validation exercise, not a report of completed tests. Use synthetic documents and test accounts rather than real employee information.

Start with one test resource and two users with different permissions:

1. **Identify the agent.** Locate its Entra Agent ID or legacy application identifier in Copilot Studio metadata and find the corresponding directory object.
2. **Inventory the connections.** Record each tool's authentication mode and any downstream flow connections.
3. **Prove the permitted path.** Retrieve the synthetic document using an authorized user's connection.
4. **Prove the denial path.** Repeat the request with the unauthorized user and verify that access is denied without disclosing the document.
5. **Compare a shared connection.** In an isolated test, confirm what changes when a maker-provided connection is used and which identity the backend records.
6. **Trace the action.** Correlate the request across available platform, gateway, and backend evidence.
7. **Test policy and revocation.** Verify the effects of removing permissions, restricting connection modes, or disabling the relevant identity. Include background execution and document any delay caused by token or session lifetimes.

Do not stop at "The agent returned an answer." Confirm that the answer was obtained through the intended permissions and that a reviewer can reconstruct what happened.

### Production boundaries

This article describes architectural choices, not a deployable reference implementation. Before production approval, also address:

- **Security:** least-privilege backend permissions, connection lifecycle, and explicit approval for high-impact actions.
- **Durable state:** for workflows that change data, persist operation status and use idempotency controls so retries do not duplicate business actions.
- **Validation:** test both permitted and denied requests, expired credentials, downstream failures, and policy changes.
- **Review:** agree on audit retention, incident ownership, and periodic access reviews with the responsible security and platform teams.

## Closing

Enterprise agent security requires more than assigning an identity. It requires a deliberate connection model, centrally governed connector access, backend-enforced permissions, and evidence that spans the request.

The useful question is not simply whether the agent is visible in Microsoft Entra. It is whether the organization can explain who initiated an action, which identity executed it, and why the backend allowed it.

When those answers are explicit and tested, agent identity becomes part of a defensible architecture rather than a substitute for one.

> **Trace every tool call to its effective caller, enforce permissions at the backend, and keep the evidence needed to explain the action.**

## References

1. Microsoft Learn: [Agent identities and authentication for Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/govern-agents-identities-overview).
2. Microsoft Learn: [Control maker-provided credentials for authentication](https://learn.microsoft.com/microsoft-copilot-studio/configure-no-maker-authentication).
3. Microsoft Learn: [Configure data policies for agents](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention).
4. Microsoft Learn: [Advanced connector policies](https://learn.microsoft.com/power-platform/admin/advanced-connector-policies).
