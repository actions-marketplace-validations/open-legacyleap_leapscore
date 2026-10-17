/** tooling/scripts/snapshot-data.ts — curated source for the vendored offline
 * datasets (detector-honesty D3). This file is the single source of truth: the
 * refresh script (refresh-snapshots.ts) compiles it to versioned JSON under
 * apps/scanner/src/scan/snapshots/. Never hand-edit the generated JSON.
 *
 * Scope (design D3): (a) runtime/framework end-of-life, (b) a pinned advisory
 * subset for the ecosystems whose manifests the sniffer parses, (c) a small
 * package metadata table (latest major, last release, license) so major-drift,
 * abandonment and direct-dependency license facts can be measured offline.
 *
 * Data is deliberately curated and small — the release-packaging size budget
 * owns the final size; this is the interface, not the number.
 */

export type EolCycle = { cycle: string; eol: string | null; latest?: string };
export type EolRuntime = { aliases?: string[]; cycles: EolCycle[]; /** Exact cycle matching only — no nearest-lower fallback (version-graded vendor releases, e.g. Delphi). */ exact_cycles?: boolean };
export type EolFramework = {
  latest_major: number;
  support_status: 'active' | 'maintenance' | 'eol';
  eol_date?: string | null;
  aliases?: string[];
};
export type PkgMeta = { latest_major: number; last_release: string; license: string };
export type AdvisorySeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type Advisory = {
  id: string;
  ecosystem: string;
  package: string;
  severity: AdvisorySeverity;
  /** Lower bound (inclusive); usually "0.0.0". */
  introduced: string;
  /** Fixed version (exclusive upper bound). Absent when no fix exists yet. */
  fixed?: string;
  published: string;
  title: string;
};

export const EOL_SOURCE = {
  source:
    'curated endoflife.date cycle tables where upstream exists (node, python, java, go, ruby, php, dotnet) + vendor lifecycle records for products endoflife.date lacks (dotnetfx: OS-bound .NET Framework component lifecycle, 4.8.1 in support; vb6: toolchain end-of-life 2008 with an OS-bound runtime; delphi: version-graded Embarcadero releases, exact-cycle matching only — an unmappable version resolves to unknown, never to a lower cycle) + per-ecosystem package registries (offline subset). Selection rule: one row per product/package the legacy pilots pin, with the lifecycle framing recorded as published by the vendor (OS-bound or toolchain), never a blanket EOL guess',
  data_date: '2026-10-17',
  runtimes: {
    node: {
      aliases: ['nodejs', 'node-js', 'io.js'],
      cycles: [
        { cycle: '10', eol: '2021-04-30', latest: '10.24.1' },
        { cycle: '12', eol: '2022-04-30', latest: '12.22.12' },
        { cycle: '14', eol: '2023-04-30', latest: '14.21.3' },
        { cycle: '16', eol: '2023-09-11', latest: '16.20.2' },
        { cycle: '18', eol: '2025-04-30', latest: '18.20.4' },
        { cycle: '20', eol: '2026-04-30', latest: '20.18.0' },
        { cycle: '22', eol: '2027-04-30', latest: '22.11.0' },
        { cycle: '24', eol: '2028-04-30', latest: '24.1.0' },
      ],
    },
    python: {
      aliases: ['python3', 'cpython'],
      cycles: [
        { cycle: '3.6', eol: '2021-12-23', latest: '3.6.15' },
        { cycle: '3.7', eol: '2023-06-27', latest: '3.7.17' },
        { cycle: '3.8', eol: '2024-10-07', latest: '3.8.20' },
        { cycle: '3.9', eol: '2025-10-31', latest: '3.9.20' },
        { cycle: '3.10', eol: '2026-10-31', latest: '3.10.15' },
        { cycle: '3.11', eol: '2027-10-31', latest: '3.11.10' },
        { cycle: '3.12', eol: '2028-10-31', latest: '3.12.7' },
        { cycle: '3.13', eol: '2029-10-31', latest: '3.13.0' },
      ],
    },
    java: {
      aliases: ['jdk', 'openjdk', 'temurin'],
      cycles: [
        { cycle: '6', eol: '2018-12-31', latest: '6u211' },
        { cycle: '7', eol: '2022-07-19', latest: '7u80' },
        { cycle: '8', eol: '2030-12-31', latest: '8u432' },
        { cycle: '11', eol: '2026-09-30', latest: '11.0.25' },
        { cycle: '17', eol: '2029-09-30', latest: '17.0.12' },
        { cycle: '21', eol: '2031-09-30', latest: '21.0.5' },
      ],
    },
    dotnet: {
      aliases: ['dotnet-core', '.net', 'netcore', 'dotnetruntime', 'net'],
      cycles: [
        { cycle: '2.1', eol: '2021-08-21', latest: '2.1.30' },
        { cycle: '3.1', eol: '2022-12-13', latest: '3.1.32' },
        { cycle: '5.0', eol: '2022-05-08', latest: '5.0.17' },
        { cycle: '6.0', eol: '2024-11-12', latest: '6.0.36' },
        { cycle: '7.0', eol: '2024-05-14', latest: '7.0.20' },
        { cycle: '8.0', eol: '2026-11-10', latest: '8.0.21' },
        { cycle: '9.0', eol: '2026-05-12', latest: '9.0.10' },
        { cycle: '10.0', eol: '2028-11-14', latest: '10.0.1' },
      ],
    },
    dotnetfx: {
      // OS-bound component lifecycle (design D4): 4.8.1 in support; the 2.0/3.5
      // and 4.5/4.5.1/4.5.2/4.6/4.6.1 lineages are the flags.
      aliases: ['netfx', '.netframework', 'netframework', 'dotnet-framework', '.net-framework'],
      cycles: [
        { cycle: '2.0', eol: '2011-04-12', latest: '2.0.50727' },
        { cycle: '3.5', eol: '2011-04-12', latest: '3.5.30729' },
        { cycle: '4.0', eol: '2016-01-12', latest: '4.0.30319' },
        { cycle: '4.5', eol: '2016-01-12', latest: '4.5.51209' },
        { cycle: '4.5.1', eol: '2016-01-12', latest: '4.5.50938' },
        { cycle: '4.5.2', eol: '2022-04-26', latest: '4.5.51209' },
        { cycle: '4.6', eol: '2022-04-26', latest: '4.6.01586' },
        { cycle: '4.6.1', eol: '2022-04-26', latest: '4.6.01055' },
        { cycle: '4.6.2', eol: null, latest: '4.6.02074' },
        { cycle: '4.7', eol: null, latest: '4.7.02319' },
        { cycle: '4.7.1', eol: null, latest: '4.7.03190' },
        { cycle: '4.7.2', eol: null, latest: '4.7.03190' },
        { cycle: '4.8', eol: null, latest: '4.8.09032' },
        { cycle: '4.8.1', eol: null, latest: '4.8.09032' },
      ],
    },
    vb6: {
      // Toolchain-dead (mainstream support ended 2008-04-08); the runtime ships
      // as an OS-bound Windows component (design D4 — see the calibration log).
      aliases: ['visual-basic-6', 'visualbasic6', 'vb-6'],
      cycles: [{ cycle: '6.0', eol: '2008-04-08', latest: 'SP6' }],
    },
    delphi: {
      // Version-graded Embarcadero releases (vendor lifecycle records): releases
      // inside the supported window are live, older ones past. Exact-cycle
      // matching only; the 4.1 project-version table maps .dproj/.dof evidence
      // onto these labels and anything unmappable stays `unknown` (design D4/D7).
      aliases: ['rad-studio', 'embarcadero-delphi'],
      exact_cycles: true,
      cycles: [
        { cycle: '6', eol: '2008-12-31' },
        { cycle: '7', eol: '2008-12-31' },
        { cycle: '2009', eol: '2011-12-31' },
        { cycle: 'XE', eol: '2013-12-31' },
        { cycle: 'XE2', eol: '2014-12-31' },
        { cycle: 'XE3', eol: '2015-12-31' },
        { cycle: 'XE4', eol: '2016-12-31' },
        { cycle: 'XE5', eol: '2016-12-31' },
        { cycle: 'XE6', eol: '2017-12-31' },
        { cycle: 'XE7', eol: '2018-12-31' },
        { cycle: 'XE8', eol: '2019-12-31' },
        { cycle: '10', eol: '2020-12-31' },
        { cycle: '10.1', eol: '2021-12-31' },
        { cycle: '10.2', eol: '2022-12-31' },
        { cycle: '10.3', eol: '2023-12-31' },
        { cycle: '10.4', eol: '2024-12-31' },
        { cycle: '11', eol: '2025-12-31' },
        { cycle: '12', eol: null },
      ],
    },
    go: {
      aliases: ['golang'],
      cycles: [
        { cycle: '1.19', eol: '2023-08-08', latest: '1.19.13' },
        { cycle: '1.20', eol: '2024-02-06', latest: '1.20.14' },
        { cycle: '1.21', eol: '2024-08-13', latest: '1.21.13' },
        { cycle: '1.22', eol: '2025-02-11', latest: '1.22.12' },
        { cycle: '1.23', eol: '2025-08-12', latest: '1.23.8' },
        { cycle: '1.24', eol: '2026-02-10', latest: '1.24.0' },
      ],
    },
    ruby: {
      aliases: ['mri'],
      cycles: [
        { cycle: '2.7', eol: '2023-03-31', latest: '2.7.8' },
        { cycle: '3.0', eol: '2024-03-31', latest: '3.0.7' },
        { cycle: '3.1', eol: '2025-03-31', latest: '3.1.6' },
        { cycle: '3.2', eol: '2026-03-31', latest: '3.2.6' },
        { cycle: '3.3', eol: '2027-03-31', latest: '3.3.6' },
      ],
    },
    php: {
      cycles: [
        { cycle: '7.4', eol: '2022-11-28', latest: '7.4.33' },
        { cycle: '8.0', eol: '2023-11-26', latest: '8.0.30' },
        { cycle: '8.1', eol: '2025-12-31', latest: '8.1.29' },
        { cycle: '8.2', eol: '2026-12-31', latest: '8.2.24' },
        { cycle: '8.3', eol: '2027-12-31', latest: '8.3.13' },
      ],
    },
  } as Record<string, EolRuntime>,
  frameworks: {
    react: { latest_major: 19, support_status: 'active' },
    'react-native': { latest_major: 0, support_status: 'active' },
    vue: { latest_major: 3, support_status: 'active' },
    angular: { latest_major: 18, support_status: 'active' },
    angularjs: { latest_major: 1, support_status: 'eol', eol_date: '2021-12-31' },
    svelte: { latest_major: 5, support_status: 'active' },
    next: { latest_major: 15, support_status: 'active' },
    nuxt: { latest_major: 3, support_status: 'active' },
    express: { latest_major: 5, support_status: 'maintenance' },
    nestjs: { latest_major: 10, support_status: 'active' },
    ember: { latest_major: 5, support_status: 'maintenance' },
    django: { latest_major: 5, support_status: 'active' },
    flask: { latest_major: 3, support_status: 'active' },
    fastapi: { latest_major: 0, support_status: 'active' },
    rails: { latest_major: 8, support_status: 'active' },
    'spring-boot': { latest_major: 3, support_status: 'active' },
    quarkus: { latest_major: 3, support_status: 'active' },
    // legacy-stacks 3.1: .NET / Struts framework lineage (design D4 framing)
    aspnet: {
      // Classic ASP.NET (WebForms/MVC 5/Web API) rides .NET Framework's OS-bound
      // lifecycle — maintenance, not blanket-EOL (mirrors the dotnetfx framing).
      latest_major: 5,
      support_status: 'maintenance',
      eol_date: null,
      aliases: ['webforms', 'asp.net', 'asp.net-webforms', 'classic-asp.net'],
    },
    entityframework: {
      // EF6 is the classic-EF lineage: fixes continue on .NET Framework only.
      latest_major: 6,
      support_status: 'maintenance',
      eol_date: null,
      aliases: ['ef6', 'entity-framework', 'entityframework6'],
    },
    struts2: {
      latest_major: 6,
      support_status: 'active',
      aliases: ['struts', 'apache-struts', 'struts2-core'],
    },
    laravel: { latest_major: 11, support_status: 'active' },
    gin: { latest_major: 1, support_status: 'active' },
  } as Record<string, EolFramework>,
  packages: {
    js: {
      lodash: { latest_major: 4, last_release: '2020-08-13', license: 'MIT' },
      express: { latest_major: 5, last_release: '2024-10-01', license: 'MIT' },
      react: { latest_major: 19, last_release: '2024-12-05', license: 'MIT' },
      'react-dom': { latest_major: 19, last_release: '2024-12-05', license: 'MIT' },
      axios: { latest_major: 1, last_release: '2024-11-13', license: 'MIT' },
      qs: { latest_major: 6, last_release: '2025-01-01', license: 'BSD-3-Clause' },
      minimist: { latest_major: 1, last_release: '2022-02-02', license: 'MIT' },
      chokidar: { latest_major: 4, last_release: '2024-09-24', license: 'MIT' },
      moment: { latest_major: 2, last_release: '2023-01-01', license: 'MIT' },
      'left-pad': { latest_major: 1, last_release: '2016-03-22', license: 'WTFPL' },
      request: { latest_major: 2, last_release: '2020-02-11', license: 'Apache-2.0' },
      colors: { latest_major: 1, last_release: '2022-01-10', license: 'MIT' },
      webpack: { latest_major: 5, last_release: '2024-06-01', license: 'MIT' },
      typescript: { latest_major: 5, last_release: '2024-11-22', license: 'Apache-2.0' },
      vitest: { latest_major: 2, last_release: '2024-12-01', license: 'MIT' },
      jest: { latest_major: 29, last_release: '2024-08-01', license: 'MIT' },
    },
    py: {
      django: { latest_major: 5, last_release: '2024-12-04', license: 'BSD-3-Clause' },
      flask: { latest_major: 3, last_release: '2024-11-01', license: 'BSD-3-Clause' },
      fastapi: { latest_major: 0, last_release: '2024-12-01', license: 'MIT' },
      requests: { latest_major: 2, last_release: '2024-05-29', license: 'Apache-2.0' },
      urllib3: { latest_major: 2, last_release: '2024-09-01', license: 'MIT' },
      pyyaml: { latest_major: 6, last_release: '2024-08-01', license: 'MIT' },
      numpy: { latest_major: 2, last_release: '2025-01-01', license: 'BSD-3-Clause' },
      sqlalchemy: { latest_major: 2, last_release: '2024-10-01', license: 'MIT' },
      celery: { latest_major: 5, last_release: '2024-06-01', license: 'BSD-3-Clause' },
      psycopg2: { latest_major: 2, last_release: '2023-10-01', license: 'LGPL-3.0-or-later' },
      mysqlclient: { latest_major: 2, last_release: '2024-06-01', license: 'GPL-2.0' },
      'pdfkit': { latest_major: 1, last_release: '2021-05-01', license: 'MIT' },
      paramiko: { latest_major: 3, last_release: '2024-09-01', license: 'LGPL-2.1' },
    },
    go: {
      'github.com/gin-gonic/gin': { latest_major: 1, last_release: '2024-08-01', license: 'MIT' },
      'golang.org/x/text': { latest_major: 0, last_release: '2024-10-01', license: 'BSD-3-Clause' },
      'github.com/stretchr/testify': { latest_major: 1, last_release: '2024-09-01', license: 'MIT' },
      'github.com/gogo/protobuf': { latest_major: 1, last_release: '2021-04-01', license: 'BSD-3-Clause' },
      'github.com/spf13/cobra': { latest_major: 1, last_release: '2024-08-01', license: 'Apache-2.0' },
    },
    rust: {
      serde: { latest_major: 1, last_release: '2024-09-01', license: 'MIT OR Apache-2.0' },
      tokio: { latest_major: 1, last_release: '2024-10-01', license: 'MIT' },
      regex: { latest_major: 1, last_release: '2024-09-01', license: 'MIT OR Apache-2.0' },
      rand: { latest_major: 0, last_release: '2024-03-01', license: 'MIT OR Apache-2.0' },
    },
    java: {
      'org.springframework.boot:spring-boot-starter-web': { latest_major: 3, last_release: '2024-11-21', license: 'Apache-2.0' },
      'com.google.guava:guava': { latest_major: 33, last_release: '2024-09-01', license: 'Apache-2.0' },
      'org.apache.logging.log4j:log4j-core': { latest_major: 2, last_release: '2024-08-01', license: 'Apache-2.0' },
      'org.junit.jupiter:junit-jupiter': { latest_major: 5, last_release: '2024-09-01', license: 'EPL-2.0' },
      'org.hibernate:hibernate-core': { latest_major: 6, last_release: '2024-10-01', license: 'LGPL-2.1' },
      'mysql:mysql-connector-java': { latest_major: 8, last_release: '2023-10-01', license: 'GPL-2.0' },
      // legacy-stacks 3.1: legacy-load-bearing Java dependencies
      'org.apache.struts:struts2-core': { latest_major: 6, last_release: '2024-12-01', license: 'Apache-2.0' },
      'org.springframework:spring-core': { latest_major: 6, last_release: '2024-11-01', license: 'Apache-2.0' },
      'commons-io:commons-io': { latest_major: 2, last_release: '2024-10-01', license: 'Apache-2.0' },
      'org.apache.commons:commons-lang3': { latest_major: 3, last_release: '2024-09-01', license: 'Apache-2.0' },
      'com.fasterxml.jackson.core:jackson-databind': { latest_major: 2, last_release: '2024-11-01', license: 'Apache-2.0' },
      'org.slf4j:slf4j-api': { latest_major: 2, last_release: '2025-01-01', license: 'MIT' },
      'org.projectlombok:lombok': { latest_major: 1, last_release: '2024-10-01', license: 'MIT' },
      'junit:junit': { latest_major: 4, last_release: '2021-02-13', license: 'EPL-1.0' },
      'log4j:log4j': { latest_major: 1, last_release: '2012-05-01', license: 'Apache-2.0' },
    },
    ruby: {
      rails: { latest_major: 8, last_release: '2024-11-07', license: 'MIT' },
      sinatra: { latest_major: 4, last_release: '2024-09-01', license: 'MIT' },
      nokogiri: { latest_major: 1, last_release: '2024-10-01', license: 'MIT' },
      rake: { latest_major: 13, last_release: '2024-06-01', license: 'MIT' },
    },
    php: {
      'laravel/framework': { latest_major: 11, last_release: '2024-11-01', license: 'MIT' },
      'guzzlehttp/guzzle': { latest_major: 7, last_release: '2024-09-01', license: 'MIT' },
      'symfony/console': { latest_major: 7, last_release: '2024-11-01', license: 'MIT' },
    },
    // legacy-stacks 3.1: NuGet (.NET/VB.NET) — canonical NuGet package IDs
    csharp: {
      'Newtonsoft.Json': { latest_major: 13, last_release: '2023-03-08', license: 'MIT' },
      EntityFramework: { latest_major: 6, last_release: '2024-04-01', license: 'MIT' },
      'Microsoft.EntityFrameworkCore': { latest_major: 10, last_release: '2025-11-11', license: 'MIT' },
      'Microsoft.AspNet.Mvc': { latest_major: 5, last_release: '2022-07-01', license: 'Apache-2.0' },
      'Microsoft.AspNet.WebApi.Core': { latest_major: 5, last_release: '2022-07-01', license: 'Apache-2.0' },
      'System.Text.Encodings.Web': { latest_major: 10, last_release: '2025-11-11', license: 'MIT' },
      log4net: { latest_major: 2, last_release: '2023-08-01', license: 'Apache-2.0' },
      Dapper: { latest_major: 2, last_release: '2023-04-01', license: 'Apache-2.0' },
      Serilog: { latest_major: 4, last_release: '2024-06-01', license: 'Apache-2.0' },
      NUnit: { latest_major: 4, last_release: '2024-12-01', license: 'MIT' },
      xunit: { latest_major: 2, last_release: '2024-11-01', license: 'Apache-2.0' },
    },
  } as Record<string, Record<string, PkgMeta>>,
};

export const ADVISORY_SOURCE = {
  source:
    'pinned advisory subset (OSV/GHSA/CVE) scoped to the ecosystems whose manifests the sniffer parses — offline snapshot. Selection rule: load-bearing legacy CVEs (remote-exploitable or framework-integral) with a known fixed release on dependencies the legacy pilots pin; the affected range is approximated as the interval [introduced, fixed), where `fixed` is the fix on the newest maintained branch — older-branch backports can read as affected (a deliberate false-positive bias: this is a legacy-estate check, and it must not report a vulnerable pin as clean)',
  data_date: '2026-10-17',
  advisories: [
    { id: 'CVE-2020-8203', ecosystem: 'js', package: 'lodash', severity: 'HIGH', introduced: '0.0.0', fixed: '4.17.21', published: '2020-07-15', title: 'Prototype pollution in lodash' },
    { id: 'CVE-2023-29017', ecosystem: 'js', package: 'vm2', severity: 'CRITICAL', introduced: '0.0.0', fixed: '3.9.17', published: '2023-03-28', title: 'Sandbox escape in vm2' },
    { id: 'CVE-2021-44906', ecosystem: 'js', package: 'minimist', severity: 'HIGH', introduced: '0.0.0', fixed: '1.2.6', published: '2021-11-22', title: 'Prototype pollution in minimist' },
    { id: 'CVE-2024-29041', ecosystem: 'js', package: 'express', severity: 'MODERATE', introduced: '0.0.0', fixed: '4.19.2', published: '2024-03-25', title: 'Open redirect in express' },
    { id: 'CVE-2021-44228', ecosystem: 'java', package: 'org.apache.logging.log4j:log4j-core', severity: 'CRITICAL', introduced: '2.0.0', fixed: '2.17.0', published: '2021-12-10', title: 'Log4Shell remote code execution' },
    // legacy-stacks 3.1: legacy Java stack (Struts/Spring/Jackson)
    { id: 'CVE-2017-5638', ecosystem: 'java', package: 'org.apache.struts:struts2-core', severity: 'CRITICAL', introduced: '2.3.5', fixed: '2.5.10.1', published: '2017-03-11', title: 'Struts Jakarta multipart parser OGNL RCE (S2-045)' },
    { id: 'CVE-2022-22965', ecosystem: 'java', package: 'org.springframework:spring-core', severity: 'CRITICAL', introduced: '0.0.0', fixed: '5.3.18', published: '2022-04-01', title: 'Spring4Shell data-binding RCE' },
    { id: 'CVE-2020-36518', ecosystem: 'java', package: 'com.fasterxml.jackson.core:jackson-databind', severity: 'HIGH', introduced: '2.0.0', fixed: '2.13.2.1', published: '2022-03-24', title: 'Deeply nested objects denial of service in jackson-databind' },
    // legacy-stacks 3.1: NuGet (.NET/VB.NET)
    { id: 'CVE-2018-1285', ecosystem: 'csharp', package: 'log4net', severity: 'HIGH', introduced: '0.0.0', fixed: '2.0.8', published: '2020-05-14', title: 'XXE in log4net configuration parsing' },
    { id: 'CVE-2021-26701', ecosystem: 'csharp', package: 'System.Text.Encodings.Web', severity: 'HIGH', introduced: '4.0.0', fixed: '4.7.2', published: '2021-02-25', title: 'Remote code execution in System.Text.Encodings.Web' },
    { id: 'CVE-2023-32681', ecosystem: 'py', package: 'requests', severity: 'MODERATE', introduced: '0.0.0', fixed: '2.31.0', published: '2023-05-26', title: 'Proxy-Authorization header leak' },
    { id: 'CVE-2023-45803', ecosystem: 'py', package: 'urllib3', severity: 'HIGH', introduced: '0.0.0', fixed: '2.0.7', published: '2023-10-02', title: 'Request body leak on redirect' },
    { id: 'CVE-2024-38875', ecosystem: 'py', package: 'django', severity: 'MODERATE', introduced: '0.0.0', fixed: '4.2.14', published: '2024-06-04', title: 'Denial of service in Django' },
  ] as Advisory[],
};
