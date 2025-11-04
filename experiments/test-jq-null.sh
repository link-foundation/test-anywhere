#!/bin/bash

echo "Testing jq null behavior..."
echo ""

# Test with actual null value
echo "Test 1: jq output when field is null"
echo '{"auto_merge": null}' | jq -r '.auto_merge'
VAL=$(echo '{"auto_merge": null}' | jq -r '.auto_merge')
echo "Value: [$VAL]"
echo "Length: ${#VAL}"
if [ "$VAL" != "null" ]; then
  echo "  Condition [ \"\$VAL\" != \"null\" ] = TRUE"
else
  echo "  Condition [ \"\$VAL\" != \"null\" ] = FALSE"
fi
echo ""

# Test with actual object
echo "Test 2: jq output when field is an object"
echo '{"auto_merge": {"enabled": true}}' | jq -r '.auto_merge'
VAL=$(echo '{"auto_merge": {"enabled": true}}' | jq -r '.auto_merge')
echo "Value: [$VAL]"
if [ "$VAL" != "null" ]; then
  echo "  Condition [ \"\$VAL\" != \"null\" ] = TRUE"
else
  echo "  Condition [ \"\$VAL\" != \"null\" ] = FALSE"
fi
echo ""

echo "Test 3: Using --jq (not -r) for null"
VAL=$(echo '{"auto_merge": null}' | jq --jq '.auto_merge' 2>&1 || echo '{"auto_merge": null}' | jq '.auto_merge')
echo "Value: [$VAL]"
echo ""

echo "CONCLUSION: gh api uses jq without -r flag, so null becomes empty string"
