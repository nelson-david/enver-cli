# Contributing to Enver CLI

Thank you for your interest in contributing to the Enver CLI! This document outlines the process for contributing to this project.

## Getting Started

1. **Fork the repository**: Go to GitHub and click the "Fork" button
2. **Clone your fork**: `git clone https://github.com/your-username/enver-cli.git`
3. **Create your feature branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the guidelines below
5. **Commit your changes**: `git commit -am 'Add some feature'`
6. **Push to the branch**: `git push origin feature/your-feature-name`
7. **Submit a Pull Request** to the `main` branch

## Code Standards

### TypeScript/JavaScript
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for all new code
- Prefer functional components with hooks over class components
- Use async/await over promises where possible

### Security-First Mindset
- **Never commit secrets** (API keys, passwords, tokens)
- Always validate and sanitize user inputs
- Follow the principle of least privilege
- Consider security implications of every change

### Testing
- Add unit tests for new features
- Run existing tests before submitting: `npm test`
- Aim for >80% code coverage

## Pull Request Process

1. **Describe your changes** clearly in the PR description
2. **Link related issues** (e.g., "Fixes #123")
3. **Update documentation** if needed
4. **Keep PRs focused** - one feature/fix per PR
5. **Wait for review** - address feedback promptly

## Security Issues

**Do NOT create public issues for security vulnerabilities.**

Instead, contact the main developer directly via email with the subject "SECURITY ISSUE". Provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 24 hours and coordinate a fix.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold this code.

## Thank You

Thank you for helping make Enver CLI better! 🚀