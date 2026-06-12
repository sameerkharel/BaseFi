# Adapter Contract

Every protocol integration in BaseFi should implement the shared `ProtocolAdapter` interface.

## Requirements

- Return normalized positions in the common portfolio shape.
- Return yield quotes in a consistent structure.
- Keep protocol-specific details in metadata fields rather than custom UI logic.
- Make the adapter safe to add without modifying the dashboard core.
