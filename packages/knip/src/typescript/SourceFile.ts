import ts from 'typescript';

// The members of ts.SourceFile below are added by binding and not public, so we add them here

// Overriding a SymbolTable to use string instead of __String as key (type SymbolTable = UnderscoreEscapedMap<Symbol>)
type SymbolTable = Map<string, ts.Symbol>;

type SymbolWithExports = ts.Symbol & {
  exports?: SymbolTable;
};

type PragmaMap = { arguments: { factory: string } };

export interface BoundSourceFile extends ts.SourceFile {
  // Used in `maybeAddAliasedExport`
  symbol?: SymbolWithExports;

  // Used in `addImport`, but only available in TypeScript <5.3.0
  resolvedModules?: ts.ModeAwareCache<ts.ResolvedModuleWithFailedLookupLocations>;

  // Used in `maybeAddNamespaceAccessAsImport` (perf only)
  locals?: SymbolTable;

  scriptKind?: ts.ScriptKind;

  pragmas?: Map<string, PragmaMap | PragmaMap[]>;
}

export interface ProgramMaybe53 extends ts.Program {
  // Only available in TypeScript =>5.3.0
  getResolvedModule?: (
    f: ts.SourceFile,
    moduleName: string,
    mode: ts.ResolutionMode
  ) => ts.ResolvedModuleWithFailedLookupLocations | undefined;
}

export type GetResolvedModule = (name: string) => ts.ResolvedModuleWithFailedLookupLocations | undefined;
