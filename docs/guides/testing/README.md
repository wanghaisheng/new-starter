# Testing Documentation

This directory contains documentation related to testing practices and procedures in the HeyTCM project.

## Directory Structure

```
testing/
├── unit/                # Unit testing
│   ├── frontend/       # Frontend unit tests
│   ├── backend/        # Backend unit tests
│   └── shared/         # Shared unit tests
├── integration/         # Integration testing
│   ├── api/           # API integration tests
│   ├── database/      # Database integration tests
│   └── services/      # Service integration tests
└── e2e/                # End-to-end testing
    ├── web/           # Web application tests
    ├── mobile/        # Mobile application tests
    └── offline/       # Offline functionality tests
```

## Documentation Purpose

### Unit Testing
- Frontend component testing
- Backend service testing
- Shared utility testing
- Test coverage and quality metrics

### Integration Testing
- API endpoint testing
- Database interaction testing
- Service integration testing
- Cross-service communication testing

### End-to-End Testing
- Web application flow testing
- Mobile application flow testing
- Offline functionality testing
- User journey testing

## Testing Subdomains

### Integration Testing
详见 integration/database-testing.md，包含数据库集成测试方案与进度。

### Unit Testing
详见 unit/README.md，包含单元测试规范与用例。

### End-to-End (E2E) Testing
详见 e2e/README.md，包含端到端测试场景与移动端测试进度。

---

> integration/unit/e2e 子目录 README.md 内容已合并至本文件，原文件可精简或删除。

## Usage

1. Start with unit testing documentation for component-level testing
2. Use integration testing guides for service interaction testing
3. Follow end-to-end testing procedures for complete flow testing
4. Refer to offline testing guides for offline functionality verification

## Contributing

When adding new testing documentation:
1. Place it in the appropriate subdirectory
2. Follow the existing documentation style
3. Include test examples and scenarios
4. Update cross-references to related documents

## Related Documents

- [Database Testing](./integration/database-testing.md) - Database integration testing procedures
- [Mobile Testing](./e2e/mobile-testing.md) - Mobile application testing progress
- [Dating App Journey](./e2e/dating-app-journey.md) - End-to-end testing scenarios for the dating app 