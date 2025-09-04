# Testing and CI/CD Setup

## Overview

This project uses a comprehensive testing strategy with automated CI/CD pipelines to ensure code quality and prevent regressions.

## Test Structure

### Test Locations
- **Action Tests**: `src/actions/test/` - Tests for OpenWhisk actions
- **Web Tests**: `src/dx-excshell-1/test/` - Tests for web application
- **Mock Tests**: `src/actions/test/mocks/` - Tests for mock implementations

### Mock System
The project includes a complete mocking system for external dependencies:

- **`@adobe/aio-lib-files`** - File storage operations
- **`@adobe/aio-lib-state`** - Key-value state storage
- **`@adobe/aio-lib-core-logging`** - Logging functionality
- **`@adobe/aio-lib-events`** - Adobe I/O Events APIs
- **`openwhisk()`** - OpenWhisk action invocation

## Running Tests

### Local Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=BrandManager.test.ts
npm test -- --testPathPattern=MockAioLibEvents.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Adobe I/O CLI Testing
```bash
# Test actions only
aio app test -e application --no-serve

# Test web only
aio app test -e dx/excshell/1 --no-actions

# Test everything
aio app test
```

## CI/CD Pipeline

### Pull Request Testing
Every pull request automatically triggers:

1. **Node.js 22 Setup** - Latest LTS version
2. **Dependency Installation** - `npm install`
3. **Adobe I/O CLI Setup** - Latest CLI version
4. **Authentication** - OAuth STS setup
5. **Build Process** - Action compilation
6. **Test Execution** - All test suites
7. **Result Verification** - Test success confirmation

### Branch Protection Rules
The main branch is protected with:

- **Required Status Checks**: Tests must pass before merge
- **Pull Request Reviews**: At least 1 approval required
- **No Force Pushes**: Prevents history rewriting
- **No Direct Commits**: All changes must go through PRs

## Workflow Files

### `pr_test.yml`
- Triggers on PR creation and updates
- Runs tests on Ubuntu, macOS, and Windows
- Uses Adobe I/O CLI for testing
- Ensures all tests pass before merge

### `branch-protection.yml`
- Sets up branch protection rules
- Runs weekly to maintain protection
- Can be manually triggered if needed

### `security-scan.yml`
- Runs Gitleaks and CodeQL scans
- Identifies potential security issues
- Prevents secrets from being committed

## Test Requirements

### Before Merging to Main
1. ✅ All tests must pass locally
2. ✅ All tests must pass in CI
3. ✅ No security vulnerabilities
4. ✅ Code review approval
5. ✅ Branch protection rules satisfied

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: Mock-based external dependency testing
- **End-to-End Tests**: Complete workflow testing

## Troubleshooting

### Common Issues

#### Tests Failing Locally
```bash
# Clear Jest cache
npx jest --clearCache

# Reset mocks
npm test -- --resetMocks

# Run with verbose output
npm test -- --verbose
```

#### CI Tests Failing
1. Check if tests pass locally
2. Verify Node.js version compatibility
3. Check Adobe I/O CLI version
4. Review authentication secrets

#### Mock Issues
1. Ensure mocks are properly imported
2. Check mock factory initialization
3. Verify Jest setup configuration

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Test both success and failure scenarios
3. Mock external dependencies
4. Clean up after each test
5. Use appropriate assertions

### Mock Usage
1. Use `MockFactory` for centralized mock management
2. Reset mocks between tests
3. Verify mock interactions
4. Test error conditions

### CI/CD
1. Keep workflows simple and focused
2. Use matrix builds for multiple environments
3. Cache dependencies for faster builds
4. Provide clear error messages

## Monitoring

### Test Results
- GitHub Actions provides detailed test results
- Failed tests block PR merges
- Test coverage reports available locally

### Performance
- Monitor test execution time
- Optimize slow-running tests
- Use parallel test execution where possible

## Security

### Secret Management
- Never commit secrets to code
- Use GitHub Secrets for sensitive data
- Regular security scans prevent exposure

### Access Control
- Branch protection prevents unauthorized changes
- Required reviews ensure code quality
- Audit trail for all changes
