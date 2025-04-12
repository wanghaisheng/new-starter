# Documentation Guides

This directory contains comprehensive documentation for the HeyTCM project, organized into logical categories for easy navigation and reference.

## Directory Structure

```
guides/
├── architecture/              # Architecture documentation
│   ├── database/             # Database architecture and implementation
│   │   ├── core/            # Core database concepts
│   │   ├── implementation/  # Database implementation details
│   │   ├── testing/         # Database testing strategies
│   │   ├── README.md        # Database documentation overview
│   │   ├── model-type-compatibility.md # Type compatibility guidelines
│   │   └── firebase-initialization.md  # Firebase setup guide
│   ├── services/             # Service layer architecture
│   │   └── README.md        # Services documentation overview
│   ├── api/                  # API architecture and design
│   │   ├── README.md        # API documentation overview
│   │   ├── better-auth.md   # Authentication improvements
│   │   ├── auth-provider-adapter-guide.md # Auth provider implementation
│   │   ├── authentication-architecture.md # Auth system design
│   │   ├── api-endpoint-implementation-guide.md # Endpoint development
│   │   ├── auth-api.md      # Authentication API documentation
│   │   └── database-api.md  # Database API documentation
│   └── README.md             # Architecture documentation overview
├── development/              # Development guides
│   ├── setup/               # Project setup and initialization
│   │   └── README.md        # Setup documentation overview
│   ├── workflow/            # Development workflows
│   │   └── README.md        # Workflow documentation overview
│   ├── frontend/            # Frontend development
│   │   ├── README.md        # Frontend documentation overview
│   │   ├── import-paths.md  # Import path configuration
│   │   ├── import-enforcement.md # Import rules enforcement
│   │   ├── import-updates.md # Import update procedures
│   │   └── assets.md        # Asset management guide
│   ├── backend/             # Backend development
│   │   ├── README.md        # Backend documentation overview
│   │   └── index.md         # Backend development guide
│   ├── README.md            # Development documentation overview
│   ├── process.md           # Development process guide
│   ├── workflow.md          # Development workflow guide
│   ├── standards            # Development standards
│   ├── initialization.md    # Project initialization guide
│   ├── status.md           # Development status tracking
│   └── git-branch-strategy.md # Git branching strategy
├── testing/                  # Testing documentation
│   ├── unit/                # Unit testing
│   │   ├── README.md        # Unit testing overview
│   │   ├── test-data-service.md # Test data service guide
│   │   └── test-implementation.md # Test implementation guide
│   ├── integration/         # Integration testing
│   │   ├── README.md        # Integration testing overview
│   │   ├── database-testing.md # Database testing guide
│   │   └── database-testing-progress.md # Testing progress tracking
│   ├── e2e/                 # End-to-end testing
│   │   ├── README.md        # E2E testing overview
│   │   ├── dating-app-journey.md # App journey testing
│   │   └── mobile-testing.md # Mobile testing guide
│   ├── README.md            # Testing documentation overview
│   └── offline-functionality-testing.md # Offline testing guide
├── deployment/              # Deployment guides
│   ├── web/                 # Web deployment
│   │   ├── README.md        # Web deployment overview
│   │   └── pwa-deployment.md # PWA deployment guide
│   ├── mobile/              # Mobile deployment
│   │   ├── README.md        # Mobile deployment overview
│   │   ├── hybrid-client.md # Hybrid client implementation
│   │   ├── packaging.md     # App packaging guide
│   │   ├── development.md   # Mobile development guide
│   │   └── app-release-workflow.md # Release workflow
│   ├── ci-cd/               # CI/CD pipelines
│   │   └── README.md        # CI/CD documentation overview
│   └── README.md            # Deployment documentation overview
├── best-practices/          # Best practices
│   ├── database/            # Database best practices
│   │   ├── README.md        # Database best practices overview
│   │   └── best-practices.md # Database optimization guide
│   ├── security/            # Security best practices
│   │   └── README.md        # Security documentation overview
│   ├── performance/         # Performance optimization
│   │   ├── README.md        # Performance documentation overview
│   │   └── performance-optimization.md # Performance guide
│   └── README.md            # Best practices overview
└── tools/                   # Tools and utilities
    ├── automation/          # Automation tools
    │   └── README.md        # Automation documentation overview
    ├── README.md            # Tools documentation overview
    ├── scripts              # Scripts documentation
    └── tools-usage-guide.md # Tools usage guide
```

## Documentation Categories

### Architecture
- **Database**: Database architecture and implementation
  - ✅ Core database concepts
  - ✅ Implementation details
  - ✅ Testing strategies
  - ✅ Type compatibility guidelines
  - ✅ Firebase setup guide
- **Services**: Service layer architecture
  - 🚧 Documentation in progress
- **API**: API design and documentation
  - ✅ Authentication system
  - ✅ API endpoint implementation
  - ✅ Database API documentation
  - ✅ Auth provider adapter guide

### Development
- **Setup**: Project initialization and environment setup
  - 🚧 Documentation in progress
- **Workflow**: Development processes and workflows
  - ✅ Development workflow guide
  - ✅ Git branching strategy
  - ✅ Development process guide
- **Frontend**: Frontend development
  - ✅ Import management
  - ✅ Asset handling
  - ✅ Development standards
- **Backend**: Backend development
  - ✅ Development guide
  - ✅ Implementation standards

### Testing
- **Unit**: Unit testing practices
  - ✅ Test data service
  - ✅ Test implementation guide
- **Integration**: Integration testing strategies
  - ✅ Database testing
  - ✅ Testing progress tracking
- **E2E**: End-to-end testing approaches
  - ✅ App journey testing
  - ✅ Mobile testing guide
- ✅ Offline functionality testing guide

### Deployment
- **Web**: Web application deployment
  - ✅ PWA deployment guide
- **Mobile**: Mobile application deployment
  - ✅ Hybrid client implementation
  - ✅ App packaging
  - ✅ Development guide
  - ✅ Release workflow
- **CI/CD**: Continuous Integration and Deployment
  - 🚧 Documentation in progress

### Best Practices
- **Database**: Database optimization and best practices
  - ✅ Optimization guide
- **Security**: Security guidelines and practices
  - 🚧 Documentation in progress
- **Performance**: Performance optimization techniques
  - ✅ Performance optimization guide

### Tools
- **Automation**: Automation tools and workflows
  - 🚧 Documentation in progress
- ✅ Tools usage guide
- ✅ Scripts documentation

## Usage

1. Start with the architecture documentation to understand the system design
2. Follow development guides for setting up and working with the project
3. Refer to testing documentation for quality assurance
4. Use deployment guides for release management
5. Consult best practices for optimization and security
6. Utilize tools documentation for automation and scripting

## Contributing

When adding new documentation:
1. Place it in the appropriate category directory
2. Follow the existing documentation style and format
3. Update this README if adding new major sections
4. Ensure cross-references are maintained between related documents

## Documentation Status

- ✅ Completed: Architecture API documentation
- ✅ Completed: Development workflow and standards
- ✅ Completed: Testing documentation
- ✅ Completed: Mobile deployment documentation
- ✅ Completed: Database best practices
- ✅ Completed: Performance optimization
- ✅ Completed: Tools usage and scripts
- 🚧 In Progress: Service layer architecture
- 🚧 In Progress: Security best practices
- 🚧 In Progress: CI/CD documentation 