---
title: "Reliable Document Extraction with Independent Validation and Human Review"
description: "An updated edition of the dual-path extraction pattern: strict schemas, independent validation, confidence-aware routing, and focused human review."
date: 2025-04-20 09:00:00 -0400
categories: [AI, Generative AI & LLMs]
tags: [document-intelligence, human-in-the-loop, data-extraction, structured-outputs, azure]
toc: true
---

> This is an updated and expanded personal edition of my September 2024 Microsoft Community Hub article, [Maximizing Data Extraction Precision with Dual LLMs Integration and Human-in-the-Loop](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/maximizing-data-extraction-precision-with-dual-llms-integration-and-human-in-the/4236728). The views expressed here are my own.
{: .prompt-info }

## Why revisit this pattern?

In 2024, I described a document-processing workflow that used two independent extraction paths and sent disagreements to a human reviewer. The central idea still holds: a single extraction result should not be treated as truth merely because it is valid JSON or accompanied by a confidence score.

The implementation choices have improved since then. Microsoft Foundry Models now support [structured outputs](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/structured-outputs), which constrain model responses to a supplied JSON Schema. Azure AI Document Intelligence v4.0 is generally available through the `2024-11-30` API and adds capabilities such as overlapping fields, signature detection, and confidence at table, row, and cell levels for custom neural models.

These improvements make the pattern easier to implement, but they do not remove the need for validation. Schema conformance answers "Is the output shaped correctly?" It does not answer "Is every value true?"

## The updated design principle

The architecture should use **two meaningfully independent evidence paths**:

1. **Primary extraction** uses an LLM with structured outputs to convert document content into a strict business schema.
2. **Independent validation** uses Document Intelligence, deterministic business rules, or another appropriately different model to produce evidence for the same fields.
3. **Decision logic** compares normalized values, confidence, provenance, and business risk.
4. **Human review** receives only fields that are ambiguous, conflicting, or high impact.

The second path does not have to be another LLM. In many cases, using a different technique is preferable because two similar models can repeat the same mistake. Independence matters more than model count.

## Reference architecture

```text
Document upload
      |
      v
Preprocessing and classification
      |
      +-----------------------------+
      |                             |
      v                             v
LLM structured extraction     Document Intelligence
(strict JSON Schema)          or deterministic validator
      |                             |
      +-------------+---------------+
                    |
                    v
       Normalize and compare fields
                    |
        +-----------+-----------+
        |                       |
        v                       v
  Auto-accept               Review queue
  high-confidence           conflicts and risk
  agreement                 thresholds
                                |
                                v
                         Human decision
                                |
                                v
                    Audited final record
```

The comparison layer is the heart of the system. Without it, the application merely has two outputs instead of a validation process.

## Define one canonical schema

Both paths should map into a single canonical business schema. Structured outputs are stronger than the older JSON mode because the model must follow the supplied schema rather than simply return syntactically valid JSON.

A compact example might look like this:

```json
{
  "type": "object",
  "properties": {
    "borrower_name": { "type": ["string", "null"] },
    "lender_name": { "type": ["string", "null"] },
    "amount": { "type": ["number", "null"] },
    "effective_date": { "type": ["string", "null"] }
  },
  "required": [
    "borrower_name",
    "lender_name",
    "amount",
    "effective_date"
  ],
  "additionalProperties": false
}
```

Current structured-output constraints require all fields to be listed as required. A nullable union can represent a field that is optional in the source document. `additionalProperties: false` prevents unexpected fields from entering downstream systems.

A production schema should also have explicit normalization rules. Names may need whitespace and punctuation normalization. Monetary values need currency and scale. Dates need an unambiguous format and, when relevant, timezone handling.

## Compare evidence, not just strings

A naive comparison marks `"$30,000.00"` and `30000` as different even though they represent the same value. The decision layer should compare normalized values and retain evidence from each path.

For each field, record:

- normalized value
- original extracted value
- source path and model version
- page number and bounding region, when available
- confidence or quality signals
- validation-rule results
- final decision and reviewer identity

A field-level decision can then follow a policy such as:

| Condition | Suggested action |
| --- | --- |
| Values agree after normalization and both paths meet confidence thresholds | Auto-accept |
| Values disagree or one path is missing a value | Human review |
| Values agree but the field is financially or legally sensitive | Human review or secondary approval |
| A deterministic rule fails | Reject or quarantine |
| Document quality is below threshold | Request a better source document |

The threshold should vary by field. A mailing address and a payment amount do not carry the same business risk.

## Human review should be exception-based

The goal is not to remove people from the process as quickly as possible. The goal is to spend human attention where it changes the outcome.

A useful reviewer interface should show:

- the original document region
- the value from each extraction path
- confidence and validation signals
- the reason the field was routed to review
- an editable final value
- an audit record of the decision

Showing only disagreements can reduce review time substantially compared with asking a person to recheck every field. It also produces labeled correction data that can improve prompts, schemas, rules, and custom models.

## Measure the system at field level

A document-level success rate can hide serious errors. Evaluate by field type and risk class.

Useful measures include:

- exact match and normalized match rate
- precision, recall, and F1 for field presence
- false-accept rate for auto-approved fields
- percentage of fields routed to review
- reviewer override rate
- time per reviewed field
- cost and latency per document
- performance by document type, language, quality, and source

A critical operational measure is **silent error rate**: fields that both paths accepted but were later found to be wrong. Independent paths reduce this risk only when their failure modes are genuinely different.

## Security and production controls

For production deployments, prefer Microsoft Entra ID and managed identities over embedded keys. Apply least-privilege Azure RBAC, private networking where required, encryption, and centralized monitoring.

The pipeline should also:

- treat documents as untrusted input
- isolate uploaded content from system instructions
- scan files and enforce type and size limits
- avoid logging sensitive document content unnecessarily
- encrypt source documents, intermediate artifacts, and final records
- record model, prompt, schema, and rule versions for every decision
- define retention and deletion policies

Human review does not automatically make a workflow compliant. Review access, displayed data, and correction history must be governed as carefully as the automated extraction path.

## What changed since the original article

The 2024 pattern remains useful, but I would implement it differently today:

- Use structured outputs instead of JSON mode where supported.
- Use Document Intelligence v4.0 GA capabilities rather than anchoring production code to an old preview API.
- Treat the validator as an independent evidence path, not necessarily a second LLM.
- Route fields based on business risk as well as model confidence.
- Prefer Microsoft Entra ID and managed identities for service authentication.
- Version prompts, schemas, models, thresholds, and normalization rules together.
- Measure silent errors and reviewer overrides, not only extraction accuracy.

## Closing perspective

Reliable extraction is not produced by one model, one confidence score, or one valid JSON response. It comes from combining constrained outputs, independent evidence, deterministic checks, risk-aware routing, and accountable human decisions.

The strongest architecture is not the one that eliminates human review. It is the one that knows precisely when human judgment is worth using—and can explain why.

## References

- [Original Microsoft Community Hub article](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/maximizing-data-extraction-precision-with-dual-llms-integration-and-human-in-the/4236728)
- [Structured outputs with Azure OpenAI in Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/structured-outputs)
- [Custom document models in Azure AI Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-model?view=doc-intel-4.0.0)
- [Original reference implementation](https://github.com/JuhyunLee0/AOAI-DocIntel-Validation)
