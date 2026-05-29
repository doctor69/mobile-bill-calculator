#!/bin/bash
# Run after extract_tmobile_pdfs.py to regenerate lineItems JSON
# Usage: bash scripts/postprocess.sh
set -e
cd "$(dirname "$0")/.."
echo "Regenerating lineItems from extracted PDF data..."
python3 scripts/generate_lineitems.py
echo "Done. Building project..."
npm run build
echo "All good!"
