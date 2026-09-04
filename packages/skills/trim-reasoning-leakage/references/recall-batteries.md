# Recall batteries

These searches are discovery probes, not definitions. Review every hit semantically and exclude generated output, dependencies, fixtures, and sealed archived notes.

```sh
rg -n --hidden -i 'this PR|this branch|this stack|previous commit|this commit' <scope>
rg -n --hidden -i 'used to |no longer|previously|was renamed|was moved' <scope>
rg -n --hidden -i 'rejected in review|review round|probably |should be enough|for now' <scope>
rg -n --hidden '\(decision \d|\(audit [A-Z]\d|design §|plan §' <scope>
```

Keep issue references, measured bounds, suppression reasons, and live runtime old/new terminology when they resolve and carry a current fact.
