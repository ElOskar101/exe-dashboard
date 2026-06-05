# Exe Dashboard

Exe Dashboard manages automation runs for carrier and clinic workflows, with a strong focus on observing each run as it moves through its lifecycle.

## Language

**Execution**:
One run of an automation workflow for a specific carrier, bot, and input set.
_Avoid_: Job, run item, process row

**Client**:
The customer or practice organization that owns one or more clinics and can be associated with an **Execution**.
_Avoid_: Customer, account

**Execution Status**:
The canonical lifecycle state of an **Execution**, which must be represented consistently everywhere in the UI.
_Avoid_: Local status, sidebar status, detail status

**Execution Control Request**:
A user command that asks the system to change an **Execution**, such as pause, resume, or stop.
_Avoid_: Status change, confirmed status

**Execution Status Read Model**:
The shared client-side representation of confirmed **Execution Status** that every execution view reads from.
_Avoid_: View-local status state, detail-only status, sidebar-only status

## Relationships

- An **Execution** has exactly one current **Execution Status**
- An **Execution** is associated with one **Client**
- A **Client** can own many clinics
- An **Execution** can receive many **Execution Control Requests** over its lifetime
- The sidebar and detail page both present the same **Execution Status** for a given **Execution**
- An **Execution Control Request** does not change **Execution Status** by itself; the status changes only when the lifecycle update is confirmed by the system
- The sidebar and detail page both read confirmed status from the same **Execution Status Read Model**
- Websocket status events are the authoritative live transition feed for **Execution Status**
- HTTP execution payloads may repair the **Execution Status Read Model** when websocket events were missed

## Example dialogue

> **Dev:** "If I resume an **Execution**, can the detail page say running while the sidebar still says paused?"
> **Domain expert:** "No. An **Execution Status** is a single fact, so both views must show the same state."

## Flagged ambiguities

- "status" was being treated as both a canonical execution fact and a view-local value — resolved: **Execution Status** is a single shared fact across the UI.
- "resume response" was being treated as a status fact — resolved: control responses are not the canonical **Execution Status**.
- "frontend status" was being derived separately by each screen — resolved: both views must use one shared **Execution Status Read Model**.
- "source of truth" was interpreted as websocket-only with no recovery path — resolved: websocket owns live transitions, while HTTP may repair missed status updates.
