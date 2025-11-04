#!/bin/bash

# Test how jq handles null
echo '{"value": null}' | jq -r '.value' | cat -A
echo "---"
echo '{"value": null}' | jq '.value'
echo "---"

# Test the comparison
NULL_VALUE=$(echo '{"value": null}' | jq '.value')
echo "NULL_VALUE='$NULL_VALUE'"

if [ "$NULL_VALUE" != "null" ]; then
  echo "Not equal to 'null' - FAILS"
else
  echo "Equal to 'null' - WORKS"
fi

if [ "$NULL_VALUE" = "null" ]; then
  echo "IS null - WORKS"
else
  echo "NOT null - FAILS"
fi
