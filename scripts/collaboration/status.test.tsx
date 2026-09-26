/** @jsxRuntime automatic */
import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { UploadStatus } from '../../src/renderer/src/collaboration/upload-status'
import type { CollaborationState } from '../../src/shared/collaboration/ipc'

const state: CollaborationState = {
  configured: true,
  signedIn: true,
  userId: 'alice',
  connected: true,
  pendingUploads: 0,
  rejectedUploads: 0,
  uploadError: null,
  uploadFailures: []
}
test('pending and failed uploads are distinct from a connected idle transport', () => {
  assert.match(
    renderToStaticMarkup(<UploadStatus state={{ ...state, pendingUploads: 2 }} />),
    /2 Änderung\(en\) warten/
  )
  assert.match(
    renderToStaticMarkup(<UploadStatus state={{ ...state, uploadError: 'Lokal gespeichert' }} />),
    /Übertragung ausstehend/
  )
  assert.match(
    renderToStaticMarkup(<UploadStatus state={state} />),
    /keine ausstehenden Übertragungen/
  )
})
test('reopening a screen displays preserved rejected intent, with escaped task content', () => {
  const reopened: CollaborationState = {
    ...state,
    rejectedUploads: 1,
    uploadFailures: [
      {
        operationId: 'one',
        userId: 'alice',
        taskId: 'task',
        groupId: null,
        operation: 'PATCH',
        changes: { title: '<script>draft</script>', description: null },
        snapshot: { title: 'Old title' },
        reason: 'MISSING_OR_INACCESSIBLE',
        detectedAt: '2026-09-26'
      }
    ]
  }
  const html = renderToStaticMarkup(<UploadStatus state={reopened} />)
  assert.match(html, /1 Änderung\(en\) nicht übernommen/)
  assert.match(html, /&lt;script&gt;draft&lt;\/script&gt;/)
  assert.match(html, /Kein|Keine Beschreibung/)
  assert.doesNotMatch(html, /<script>/)
})
