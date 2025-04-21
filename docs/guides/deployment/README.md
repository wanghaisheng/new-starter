# Deployment Documentation

This directory contains documentation related to deployment processes and procedures for the HeyTCM project.

## Directory Structure

```
deployment/
├── web/                 # Web deployment
│   ├── staging/        # Staging environment
│   ├── production/     # Production environment
│   └── monitoring/     # Deployment monitoring
├── mobile/             # Mobile deployment
│   ├── ios/           # iOS deployment
│   ├── android/       # Android deployment
│   └── store/         # App store deployment
└── ci-cd/              # CI/CD pipelines
    ├── github/        # GitHub Actions
    ├── docker/        # Docker deployment
    └── kubernetes/    # Kubernetes deployment
```

## Deployment Subdomains

### Web Deployment
详见 web/README.md，涵盖 Web 应用部署流程与规范。

### Mobile Deployment
详见 mobile/README.md，涵盖移动端部署与打包流程。

### CI/CD Deployment
详见 ci-cd/README.md，涵盖持续集成与自动化部署流程。

---

> web/mobile/ci-cd 子目录 README.md 内容已归档至本文件，子目录 README.md 可保留简要说明。

## Usage

1. Follow web deployment guides for web application deployment
2. Use mobile deployment documentation for app store submissions
3. Implement CI/CD pipelines for automated deployment
4. Monitor deployments using provided guidelines

## Contributing

When adding new deployment documentation:
1. Place it in the appropriate subdirectory
2. Follow the existing documentation style
3. Include deployment checklists and procedures
4. Update cross-references to related documents 