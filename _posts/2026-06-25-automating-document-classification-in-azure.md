---
title: "Automating Document Classification in Azure: An Architecture Summary"
description: "A practical overview of an event-driven Azure architecture for splitting, classifying, indexing, and searching mixed document files."
date: 2026-06-25 09:00:00 -0400
categories: [Azure, Azure AI & Foundry]
tags: [document-intelligence, durable-functions, azure-ai-search, microsoft-foundry, document-processing]
image:
  path: /assets/img/posts/automating-document-classification-in-azure-cover.png
  alt: Microsoft Azure architecture for document ingestion, classification, metadata storage, vector indexing, and grounded conversational retrieval.
toc: true
---

> This is my personal summary of the Microsoft Learn architecture article [Automate document classification in Azure](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/automate-document-classification-durable-functions), for which I am the principal author. Microsoft maintains the original article and its current technical guidance. The views expressed here are my own.
{: .prompt-info }

## The document problem behind the architecture

Many organizations receive large PDF or TIFF files that contain several different document types. A single scanned package might include an application, identification, supporting records, correspondence, and approval forms. The organization often does not control the format, page order, or scan quality.

Traditional workflows depend on people to separate pages, identify document boundaries, assign classifications, and enter metadata. Custom state-machine applications can automate parts of that process, but they often require persistent workflow tables and polling services that become difficult to operate and extend.

The Azure architecture addresses a broader goal than classification alone. It creates a resilient pipeline that can:

- split a mixed file into logical documents
- classify each document by type
- extract content and page metadata
- preserve a traceable relationship to the source file
- create searchable text and vector representations
- let users ask grounded questions with inline citations

## Architecture at a glance

The design separates ingestion, orchestration, document analysis, metadata storage, indexing, and conversational retrieval.

```text
Web application
    |
    +--> Blob Storage: original document file
    |
    +--> Service Bus: processing request
             |
             v
       Durable Functions orchestrator
             |
             +--> Analyze: split, classify, and extract content
             |
             +--> Metadata store: save document boundaries and types
             |
             +--> Embedding: chunk, vectorize, and index content
                            |
                            v
                Azure AI Search index
                            |
                            v
             Foundry Agent Service prompt agent
                            |
                            v
                 Grounded answers with citations
```

Each service has a focused responsibility. This separation makes individual activities easier to scale, retry, monitor, and replace.

## Why Durable Functions is the control plane

A Service Bus message starts a Durable Functions instance after the source file is uploaded to Blob Storage. The orchestrator coordinates the long-running document workflow while Durable Functions manages state, checkpoints, retries, and recovery.

This is a natural fit for document processing because analysis time varies with file size, page count, and service latency. The web request does not need to remain open while processing completes, and transient failures do not require the entire file to restart from the beginning.

The orchestrator delegates work to activity functions:

1. The **analyze activity** calls Azure AI Document Intelligence to identify document boundaries, classify document types, and extract content.
2. The **metadata-store activity** records the document type, source location, and page range in Azure Cosmos DB.
3. The **embedding activity** divides extracted text into overlap-aware chunks, generates vector embeddings, and writes the content to Azure AI Search.

Durable orchestration is most valuable here as an operational boundary. Classification logic can evolve without forcing the team to rebuild state management and recovery behavior.

## Preserve metadata and correlation

Splitting a file creates a provenance challenge. Every extracted passage must remain connected to the logical document and original uploaded file from which it came.

The architecture uses Azure Cosmos DB as the classification metadata store and adds a correlation ID to each Azure AI Search document. That relationship allows a search result or citation to resolve back to its document type, page range, source location, and processing record.

This is essential for regulated or high-impact workflows. A useful answer is not enough; users need to inspect the supporting document and understand where the evidence originated.

## Turn classified content into searchable knowledge

After analysis, the pipeline prepares the content for retrieval:

- extracted text is split into chunks that fit the embedding model's context window
- overlapping passages preserve context near chunk boundaries
- a Foundry-hosted embedding model creates vector representations
- Azure AI Search stores content, vectors, and correlation metadata
- hybrid search combines keyword and vector retrieval

The reference architecture uses a Foundry Agent Service prompt agent with an Azure AI Search tool. The agent grounds responses in indexed content and returns inline citations. The application deploys and versions the agent through its release pipeline rather than creating a new agent dynamically for each user.

That distinction matters in production. A versioned agent configuration is testable and auditable, while per-request agent creation introduces unnecessary variability and lifecycle complexity.

## Design choices that should remain flexible

The architecture is a reference pattern, not a requirement to use every component exactly as shown.

Teams can adjust several choices based on their workload:

- Use a different chat model when quality, latency, or cost requirements differ.
- Use code-based agent orchestration when the solution requires custom multistep logic, multi-agent coordination, or control over the agent loop.
- Select global, data-zone, or regional model deployments according to data-residency requirements.
- Start with consumption-based model capacity for variable workloads and evaluate provisioned throughput when volume becomes predictable.
- Replace individual processing activities without changing the overall event-driven workflow.

The stable pattern is more important than a particular model: accept work asynchronously, orchestrate durable activities, preserve provenance, index enriched content, and ground responses in retrievable evidence.

## Production considerations

Document AI systems combine serverless compute, transactional metadata, search, and model inference. Production readiness therefore depends on the complete workload rather than model quality alone.

### Reliability

- Make every activity idempotent so retries do not duplicate metadata or index entries.
- Use dead-letter handling and operational dashboards for requests that repeatedly fail.
- Plan for model endpoint throttling and regional availability.
- Consider an API gateway when routing across multiple model deployments or endpoints is needed.
- Retain enough processing state to diagnose and safely replay failed work.

### Performance and scale

- Tune Azure Functions concurrency and scaling behavior for the expected file volume.
- Choose a Cosmos DB partition strategy that avoids hot partitions.
- Measure Document Intelligence and model quotas as part of end-to-end capacity planning.
- Batch embedding requests where appropriate and control parallelism to avoid downstream throttling.
- Test with realistic file sizes, document mixtures, and scan quality.

### Cost

The largest cost drivers vary by workload but commonly include page analysis, embedding generation, model inference, search capacity, storage, and orchestration volume. Track cost per processed file and per page rather than looking only at the monthly Azure bill. Those unit measures make design alternatives easier to compare.

### Security and governance

- Use Microsoft Entra ID and managed identities between Azure services.
- Apply least-privilege Azure RBAC and private networking where required.
- Encrypt source documents, extracted content, metadata, and search indexes.
- Define retention and deletion policies for original and derived content.
- Log model, classifier, agent, and pipeline versions with each processing result.
- Treat uploaded files and extracted text as untrusted input.

## Where the pattern fits

The architecture is useful when files contain multiple document types and the output must support both downstream automation and human discovery. Examples include:

- loan and insurance application packages
- aircraft, locomotive, and machinery maintenance records
- municipal permits and inspection reports
- legal or case-management document bundles
- health and benefits administration records
- retail planogram and product-label analysis

For simple, single-page forms with a fixed layout, this architecture might be more than the workload needs. Its value appears when processing is asynchronous, document boundaries are unknown, classifications vary, and users need traceable search across the results.

## What I would emphasize to implementation teams

Five decisions have an outsized effect on the success of this pattern:

1. Define document types, boundaries, and confidence thresholds before building the workflow.
2. Make correlation and source provenance part of the data model from the beginning.
3. Design every processing activity for safe retries and independent scaling.
4. Evaluate classification, extraction, retrieval, and grounded answers as separate quality stages.
5. Treat human review and operational recovery as normal workflow paths, not exceptional failures.

The architecture works because it combines deterministic orchestration with specialized AI capabilities. Durable Functions provides control and recovery. Document Intelligence identifies and extracts. Cosmos DB preserves metadata. Azure AI Search retrieves evidence. Foundry adds a grounded conversational interface.

## Closing perspective

Automated document classification is not just a model call. It is a distributed workflow that must manage unpredictable inputs, long-running operations, partial failures, provenance, retrieval quality, and user trust.

The central design principle is separation of responsibilities. When ingestion, orchestration, analysis, metadata, indexing, and user interaction have clear boundaries, each part can evolve without destabilizing the entire system.

## Credits and further reading

Microsoft maintains the complete architecture, diagram, detailed workflow, service guidance, and Well-Architected considerations:

- [Automate document classification in Azure](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/architecture/automate-document-classification-durable-functions)

Contributors to the Microsoft Learn article:

- [Peter Lee](https://www.linkedin.com/in/peter-t-lee/), principal author
- [Kevin Kraus](https://www.linkedin.com/in/kevin-w-kraus), contributor
- [Brian Swiger](https://www.linkedin.com/in/brianswiger), contributor
