# GitHub Issue Automation

This repository uses automated workflows to streamline issue management and improve the contributor experience.

## Features

### Interactive Issue Forms

I use GitHub's issue forms (YAML-based) instead of markdown templates for a better user experience:

- **Bug Reports** - Structured form with severity levels and required fields
- **Feature Requests** - Categorized with priority and use case sections
- **Questions** - Category-based with documentation check reminders

### Automated Workflows

#### Auto-Labeling

**File:** `.github/workflows/auto-label.yml`

Automatically applies labels based on keywords in issue titles and descriptions:

- **Bug-related:** `bug`, `critical`
- **Feature-related:** `enhancement`
- **Area-specific:** `auth`, `database`, `ui`, `api`, `documentation`
- **Priority:** `high-priority`, `low-priority`
- **Type:** `question`, `performance`, `security`, `testing`, `deployment`, `dependencies`

#### Stale Issue Management

**File:** `.github/workflows/stale-issues.yml`

Keeps the issue tracker clean:

- Marks issues as stale after **60 days** of inactivity
- Closes stale issues after **7 additional days**
- Exempts issues with labels: `pinned`, `security`, `critical`, `in-progress`
- Runs daily at 00:00 UTC

#### Welcome Messages

**File:** `.github/workflows/welcome.yml`

Welcomes first-time contributors:

- Detects first-time issue creators and PR authors
- Posts a friendly welcome message with helpful links
- Adds `first-time-contributor` label

#### Issue Validation

**File:** `.github/workflows/issue-validator.yml`

Ensures bug reports have required information:

- Checks for required sections (steps to reproduce, expected/actual behavior, environment)
- Validates description length and title quality
- Adds `needs-more-info` label and requests missing details

#### Auto-Assignment

**File:** `.github/workflows/auto-assign.yml`

Routes issues to the right team members:

- Assigns based on labels (`auth`, `database`, `ui`, `api`, etc.)
- **Configuration required:** Update with your team members' GitHub usernames

#### Project Board Integration

**File:** `.github/workflows/auto-project.yml`

Automatically adds issues to GitHub Projects:

- **Configuration required:** Enable and set your project ID
- See comments in the workflow file for setup instructions

#### Duplicate Detection

**File:** `.github/workflows/duplicate-detector.yml`

Helps identify duplicate issues:

- Uses title similarity algorithm
- Adds `potential-duplicate` label
- Comments with links to similar issues

#### Priority Labeling

**File:** `.github/workflows/priority-label.yml`

Automatically prioritizes issues:

- **Critical:** `critical`, `urgent`, `emergency`, `blocker`
- **High:** `important`, `asap`, `major bug`
- **Medium:** `should have`, `improvement`
- **Low:** `nice to have`, `minor`, `cosmetic`

## 🔧 Configuration

### Auto-Assignment

Edit `.github/workflows/auto-assign.yml` and update the `assignmentRules` object:

```javascript
const assignmentRules = {
  auth: ['your-username'],
  database: ['your-username'],
  ui: ['designer-username'],
  // ... add more rules
}
```

### Project Board Integration

Edit `.github/workflows/auto-project.yml` and configure:

```javascript
const projectConfig = {
  enabled: true, // Set to true after configuring
  owner: 'your-username',
  projectNumber: 1, // Your project number
}
```

## Available Labels

The automation workflows use and create these labels:

### Type Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `question` - Further information is requested
- `documentation` - Documentation improvements

### Area Labels

- `auth` - Authentication/authorization issues
- `database` - Database/Prisma related
- `ui` - User interface/design
- `api` - API endpoints/routes
- `security` - Security vulnerabilities
- `performance` - Performance improvements
- `testing` - Test-related changes
- `deployment` - Deployment/build issues
- `dependencies` - Dependency updates

### Priority Labels

- `critical` - Critical issues requiring immediate attention
- `high-priority` - High priority issues
- `medium-priority` - Medium priority issues
- `low-priority` - Low priority issues

### Status Labels

- `needs-more-info` - Requires additional information
- `stale` - No recent activity
- `potential-duplicate` - May be a duplicate issue
- `first-time-contributor` - First contribution from this user
- `in-progress` - Currently being worked on
- `pinned` - Important issue that should not be marked stale

## Customization

All workflows can be customized by editing the respective YAML files in `.github/workflows/`. Common customizations:

- **Keyword mappings** - Add/remove keywords for auto-labeling
- **Stale timeframes** - Adjust inactivity periods
- **Assignment rules** - Configure team member assignments
- **Priority keywords** - Customize priority detection
- **Validation rules** - Adjust required sections for bug reports

## Testing

To test the automations:

1. Create a test issue using one of the issue forms
2. Check that appropriate labels are applied
3. Verify welcome message appears (if first-time contributor)
4. Test validation by creating an incomplete bug report

## Notes

- Most workflows run automatically when issues are created or updated
- Stale issue management runs daily at 00:00 UTC
- Project board integration requires manual configuration
- Auto-assignment requires team member usernames to be configured
