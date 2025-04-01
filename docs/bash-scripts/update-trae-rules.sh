#!/bin/bash

# 自动同步最新文档规则到Trae配置
yq e -i '.rules[0].path = "docs/templates/coding-standards.md"' .trae-rules.yml
yq e -i '.rules[1].path = "docs/templates/frontend-development-standards.md"' .trae-rules.yml
# ...其他规则更新

# 重新加载规则
bash docs/tasks/tools/load-trae-rules.sh