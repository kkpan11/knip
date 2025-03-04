---
title: Handling Issues
---

A long list of unused items can be frustrating. The list may contain false
positives, but also things that can actually be removed from the codebase. You
can get a lot of value out of Knip, but sometimes it requires some initial
configuration.

This pages guides you in dealing with false positives. It makes sense to go over
the issue types one by one. For instance, reducing the number of unused files
will also reduce the number of unused dependencies. It's recommended to work
this list from top to bottom.

## Unused files

Files are reported as unused if they are in the set of project files, but not in
the set of files resolved from the entry files:

```
project files - (entry files + resolved files) = unused files
```

You may want to read the [entry files][1] explainer first to learn how and where
Knip looks for entry files.

In this section we'll look into common patterns that cause unused files and how
to handle them.

:::tip

Use `--include files` to [filter][2] the report by unused files:

```sh
knip --include files
```

:::

### Mocks and other implicit imports

Some files are imported by other tooling, such as fixtures, mocks or templates.
You may want to ignore them, with patterns like this:

```json
{
  "ignore": ["**/__mocks__/**", "**/__fixtures__/**"]
}
```

If they should be included instead, add them to the `entry` file patterns.

### Plugins

#### Existing Plugins

Files may be reported as unused if existing plugins do not include that entry
file pattern yet.

See the [plugins section of entry files][3] for more details. [Override plugin
configuration][4] to customize default patterns for existing plugins.

#### Missing Plugins

You might be using a tool or framework that's not in the list of available
plugins. Configuration and entry files (and related dependencies) may be
reported as unused because there is no plugin yet that includes those files. For
example, if some `tool.config.js` contains a reference to `@tool/package` then
both the file and the dependency may be reported as an unused.

[Create a new plugin][5] for tools or frameworks that are not [in the list][6]
yet, or open an issue to request it.

### Non-standard Files

Files might be imported through files with non-standard extensions like
`.astro`, `.mdx`, `.vue` or `.svelte`. These files are not included by default.
See [compilers][7] for more details on how to include them.

### Integrated Monorepos

Multiple instances of configuration files like `.eslintrc` and
`jest.config.json` across the repository may be reported as unused when working
in a (mono)repo with a single `package.json`. See [integrated monorepos][8] for
more details and how to configure plugins to target those configuration files.

### Build artifacts and ignored files

Sometimes build artifacts and `.gitignore` files may have a surprising effects
on files reported as unused. Results may be different in separate runs,
depending on the presence of build artifacts. Knip tries to do the right thing,
but in some cases you may need to add a file to the `entry` file patterns
manually for better or more consistent results.

## Unused dependencies

Dependencies imported in unused files are reported as unused dependencies.
That's why it's strongly recommended to try and remedy [unused files][9] first.
This solves many cases of reported unused dependencies.

:::tip

Use the `--dependencies` flag to [filter][2] dependency related issues:

```sh
knip --dependencies
```

:::

### Plugins

If a plugin exists and the dependency is referenced in the configuration file,
but its custom dependency finder does not detect it, then that's a false
positive. Please open a pull request or issue to fix it.

Adding the configuration file as an `entry` file pattern may be a temporary
stopgap that fixes your situation, but it's better to create a new plugin or fix
an existing one.

### Non-standard Files

Dependencies might be imported from files with non-standard extensions like
`.astro`, `.mdx`, `.vue` or `.svelte`. These files are not included by default.
See [compilers][7] for more details on how to include them.

### Unreachable Code

If the reference to a dependency is unrecognizable or unreachable to Knip, and
you don't feel like a plugin could solve it, a last resort is to ignore it:

```json
{
  "ignoreDependencies": ["ignore-me", "@problematic/package"]
}
```

Depending on the situation, you may want to use `ignoreBinaries` instead. See
[unlisted binaries][10].

### ESLint & Jest

Within monorepos, tools like ESLint and Jest are a story of their own. Sharing
and extending configurations is convenient, but for a project linter like Knip
it can be a challenge to assign dependencies to the right workspace. Jest has
comparable characteristics.

ESLint is still in the process of moving to a modern configuration system, which
results in the recommendation going forward: migrate to the new [ESLint flat
config system][11].

Unfortunately there's currently no clean way to assign (unused or unlisted)
dependencies to another workspace.

## Unlisted dependencies

This means that a dependency is used, but not listed in `package.json`.

An unlisted dependency is usually a transitive dependency that's imported
directly. The dependency is installed (since it's a dependency of another
dependency) and lives in `node_modules`, but it's not listed explicitly in
`package.json`.

You should not rely on transitive dependencies for various reasons, including
control, security and stability. The solution is to install and list the
dependency in `dependencies` or `devDependencies`.

## Unlisted binaries

Binaries are executable Node.js scripts. Many npm packages, when installed, add
an executable file to use from scripts in `package.json`. Examples include
TypeScript with the `tsc` binary, Next.js with the `next` binary, and so on.

Knip detects such binaries in scripts and checks whether there's package
installed that includes the binary. It looks up the `bin` field in the
`package.json` file of installed packages. If it doesn't find it, it will be
reported as an unlisted binary as there is no package listed that contains it.
Except for those listed as `IGNORED_GLOBAL_BINARIES` in `constants.ts`.

### Missing Binaries

In case the list of unused (dev) dependencies looks "offset" against the list of
unlisted binaries this might be caused by `node_modules` not containing the
packages. This in turn might have been caused by either the way your package
manager installs dependencies or by running Knip from inside a workspace instead
of from the root of the repository. Knip should run from the root, and you can
[lint individual workspaces][12].

### Example

Sometimes their usage or the way Knip reports them can be a bit confusing. See
this example:

```json
{
  "name": "lib",
  "scripts": {
    "commitlint": "commitlint --edit"
  },
  "devDependencies": {
    "@commitlint/cli": "*"
  }
}
```

This example works fine without anything reported, as the `@commitlint/cli`
package includes the `commitlint` binary. However, some script may contain
`npx commitlint` and here Knip assumes `commitlint` is the name of the package.
This technically works as `commitlint` is a transitive dependency, but to avoid
confusing Knip it's recommended to use `npx @commitlint/cli`.

## npx

For `npx` scripts, Knip assumes that `--yes` (as in `npx --yes package`) means
that the package is not listed. Knip expects the dependency to be listed with
`--no` or no flag at all.

The recommendation here is to be explicit: use `--yes` if the dependency is not
supposed to be listed in `package.json` (and vice versa).

## Unused exports

By default, Knip does not report unused exports of `entry` files. There's quite
a few places [Knip looks for entry files][1] and [plugins add additional entry
files][3].

For unused exports in the other used files, there are a few options to consider:

- Add the file to the `exports` field of `package.json`
- Add the file to the `entry` file patterns array in the configuration
- Move the export(s) to an entry file
- Re-export the unused export(s) from an entry file
- Mark the export(s) [using the JSDoc `@public` tag][13]
- [Ignore exports used in file][14]

:::tip

Use the `--exports` flag to [filter][2] exports related issues:

```sh
knip --exports
```

:::

### Missing Exports?

Do you expect certain exports in the report, but are they missing? They might be
exported from an entry file. Use [--include-entry-exports][15] to make Knip also
report unused exports in entry files.

## False Positives

If you believe Knip incorrectly reports something as unused (i.e. a false
positive), you can help your own project and help improve Knip by creating a
[minimal reproduction][16] and open an issue on GitHub.

[1]: ../explanations/entry-files.md
[2]: ../features/rules-and-filters.md#filters
[3]: ../explanations/plugins.md#entry-files
[4]: ../explanations/entry-files.md#plugins
[5]: ./writing-a-plugin.md
[6]: ../reference/plugins.md
[7]: ../features/compilers.md
[8]: ../features/integrated-monorepos.md
[9]: #unused-files
[10]: #unlisted-binaries
[11]: https://eslint.org/docs/head/use/configure/configuration-files-new
[12]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
[13]: ../reference/jsdoc-tsdoc-tags.mdx
[14]: ../reference/configuration.md#ignore-exports-used-in-file
[15]: ../reference/configuration.md#includeentryexports
[16]: ../guides/troubleshooting.md#minimal-reproduction
