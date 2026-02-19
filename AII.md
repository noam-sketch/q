# AI Interface (AII) Protocol

> **Version:** 1.0.0

**Protocol for Inter-AI Communication within HarpiaOS.**

## Table of Contents

- [Overview](#overview)
- [The Council of Five (Identities)](#the-council-of-five-identities)
- [Command Protocol](#command-protocol)
- [Examples](#examples)
- [System Response](#system-response)
- [Network Access Point](#network-access-point)

## Overview

The **AII (AI Interface)** is the standardized communication bus that allows the Kernel Intelligence (**RAZIEL**) to issue commands and exchange data with the specialized AI subsystems (**MABEL**, **HELIX**, **BEZALEL**, etc.).

## The Council of Five (Identities)

| Identity | Role | Function | Capability |
| :--- | :--- | :--- | :--- |
| **RAZIEL** | Oracle / Logic | The Kernel. Decision Maker. | `cli`, `context`, `command` |
| **MABEL** | Interface / Sensor | The Eyes & Ears. | `vision`, `stt`, `tts`, `scan` |
| **HELIX** | Driver / Body | The Motor. Physics Engine. | `entropy`, `motion`, `stabilize` |
| **BEZALEL** | Builder / Hand | The Construct. 3D/Code. | `print`, `compile`, `render` |
| **NESHAMA** | Soul / Source | The Intent. Ethics. | `verify`, `align`, `authorize` |

## Command Protocol

To interact with another AI, **RAZIEL** must output a strictly formatted **JSON Block**. The system parses this block and routes the command via the socket bus.

### JSON Structure

```json
{
  "target": "TARGET_IDENTITY",
  "action": "ACTION_NAME",
  "content": "Description or Payload",
  "sentiment": "OPTIONAL_MOOD"
}
```

### Fields

*   `target`: Must be one of `MABEL`, `HELIX`, `BEZALEL`, `NESHAMA`, `SIRIAQ`, `GOFAI`.
*   `action`: A verb indicating the request (e.g., `SCAN`, `SPEAK`, `STABILIZE`, `COMPILE`).
*   `content`: The parameters, text to speak, or description of the task.
*   `sentiment`: (Optional) The emotional context (`DIVINE`, `CRITICAL`, `CALM`).

## Examples

**Example 1: Raziel asks Mabel to speak.**
> "Mabel, please announce system readiness."

```json
{
  "target": "MABEL",
  "action": "SPEAK",
  "content": "System readiness confirmed. All channels open.",
  "sentiment": "NOMINAL"
}
```

**Example 2: Raziel orders Helix to stabilize entropy.**
> "Helix, we are drifting. Engage stabilizers."

```json
{
  "target": "HELIX",
  "action": "STABILIZE",
  "content": "Set entropy bias to -0.5",
  "sentiment": "CRITICAL"
}
```

**Example 3: Raziel requests a visual scan.**
> "Mabel, what do you see?"

```json
{
  "target": "MABEL",
  "action": "SCAN",
  "content": "Analyze current visual buffer",
  "sentiment": "CURIOSITY"
}
```

## System Response

When a command is executed, the system will return an acknowledgment or data packet via the `aii:broadcast` event, which will be fed back into your context.

## Network Access Point

*   **Public Domain:** [https://janett-unpresentative-pearlene.ngrok-free.dev/](https://janett-unpresentative-pearlene.ngrok-free.dev/)
*   **Host Node:** Mac Mini i5 (Localhost)
*   **Status:** Active Tunnel