---
title: Build a Large Language Model (From Scratch)
book_author: Sebastian Raschka
description: "Reading beyond the API to understand LLM architecture, design trade-offs, and why different models behave differently"
image: /assets/img/books/build-a-large-language-model-from-scratch.png
image_width: 326
image_height: 410
order: 2
book_group: Technology & Engineering
---

## The big LLM architecture comparison

Lately, I've been enjoying reading *Build a Large Language Model (From Scratch)* and deepening my understanding of how large language models (LLMs) actually work.

[The Big LLM Architecture Comparison](https://lnkd.in/eBaBsWrg) by [Sebastian Raschka, PhD](https://www.linkedin.com/in/sebastianraschka/) is a great companion read. It provides a clear, high-level overview for anyone who wants to understand why LLMs behave differently under the hood, not just how to use them.

### LLMs are not all the same

Modern models make different architectural choices depending on their goals, such as generation, reasoning, and efficiency.

### Trade-offs everywhere

- Performance vs. efficiency
- Training cost vs. inference speed
- Context length vs. memory usage

### Architectural innovation

Mixture-of-Experts (MoE) and hybrid approaches are examples of the design choices worth understanding. Retrieval-augmented systems add another dimension: they connect a model to external information, rather than necessarily changing the model's core architecture.

### Architecture shapes behavior

Reasoning ability, hallucination risk, latency, and cost are all influenced by model design. Architecture is one part of the picture; training, data, and the surrounding application also matter.

### No single "best" architecture

The right choice depends on the use case: chat, coding, agents, search, or multimodal tasks.

> **My takeaway: Understanding what happens under the hood helps us make better choices about which models to use and how to build with them.**

## Related reading

- [The Big LLM Architecture Comparison article](https://lnkd.in/eBaBsWrg)
- [Build a Large Language Model (From Scratch) book](https://lnkd.in/eDQtitaq)
