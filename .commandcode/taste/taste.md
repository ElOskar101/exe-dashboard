# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# API Contracts

- For Playwright Runtime shared members, send `string[]` of user IDs in the `sharedWith` array, not full user objects. This applies to both add/remove operations and app updates. Confidence: 0.75

# UI Patterns

- For long text cells in tables (descriptions, api URLs, etc.), truncate the text and show the full content in a popover triggered by a link button (e.g. "..." or "...more"), rather than displaying the full text inline. Prefer a generic reusable `TruncatedText` component over per-column implementations. Confidence: 0.80
