#!/usr/bin/env node
// Starts the Postgres the integration suites use, in Docker, unless it is running.
import { execFileSync } from 'node:child_process'

const name = 'tunables-postgres'
const running = execFileSync('docker', ['ps', '--filter', `name=^${name}$`, '--format', '{{.Names}}'], { encoding: 'utf8' }).trim()
if (running === name) {
  console.log(`${name} is running on port 5434.`)
} else {
  const exists = execFileSync('docker', ['ps', '-a', '--filter', `name=^${name}$`, '--format', '{{.Names}}'], { encoding: 'utf8' }).trim()
  if (exists === name) execFileSync('docker', ['start', name], { stdio: 'inherit' })
  else {
    execFileSync('docker', ['run', '-d', '--name', name, '-e', 'POSTGRES_USER=tunables', '-e', 'POSTGRES_PASSWORD=tunables', '-e', 'POSTGRES_DB=tunables', '-p', '5434:5432', 'postgres:17-alpine'], { stdio: 'inherit' })
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      execFileSync('docker', ['exec', name, 'pg_isready', '-U', 'tunables'], { stdio: 'ignore' })
      break
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  console.log(`${name} started on port 5434.`)
}
console.log('TUNABLES_TEST_DATABASE_URL=postgres://tunables:tunables@localhost:5434/tunables')
