/** @jsxRuntime automatic */
import type { JSX } from 'react'
import type {
  CollaborationState,
  CollaborationUploadFailure
} from '../../../shared/collaboration/ipc'

const reasons: Record<CollaborationUploadFailure['reason'], string> = {
  MISSING_OR_INACCESSIBLE: 'Die Aufgabe ist nicht mehr verfügbar oder du hast keinen Zugriff.',
  INVALID_TASK: 'Die Änderung erfüllt die aktuellen Gruppenregeln nicht.',
  TASK_CONFLICT: 'Die Aufgabe konnte wegen einer bestehenden Aufgabe nicht angelegt werden.',
  OPERATION_CONFLICT: 'Die Änderung konnte nicht eindeutig zugeordnet werden.',
  DEPENDENCY_REJECTED: 'Eine vorherige Änderung dieser Aufgabe wurde nicht übernommen.'
}
const operations = { PUT: 'Anlegen', PATCH: 'Ändern', DELETE: 'Löschen' }

export function UploadStatus({ state }: { state: CollaborationState }): JSX.Element {
  const label = !state.connected
    ? 'Offline · Aufgaben bleiben lokal gespeichert'
    : state.uploadError
      ? 'Übertragung ausstehend'
      : state.pendingUploads > 0
        ? `${state.pendingUploads} Änderung(en) warten auf Übertragung`
        : state.rejectedUploads > 0
          ? 'Übertragung abgeschlossen · abgelehnte Änderungen vorhanden'
          : 'Verbunden · keine ausstehenden Übertragungen'
  return (
    <section className="mt-3 space-y-2 text-sm" aria-label="Übertragungsstatus" aria-live="polite">
      <p className="text-muted-foreground">{label}</p>
      {state.uploadError && <p>{state.uploadError}</p>}
      {state.rejectedUploads > 0 && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="font-medium">{state.rejectedUploads} Änderung(en) nicht übernommen</p>
          <p>
            Die Entwürfe bleiben auf diesem Gerät gespeichert. Andere Gruppenmitglieder sehen diese
            Änderungen nicht.
          </p>
          {state.uploadFailures.map((failure) => {
            const draft = { ...failure.snapshot, ...failure.changes }
            return (
              <details key={failure.operationId}>
                <summary className="cursor-pointer">
                  {operations[failure.operation]}:{' '}
                  {typeof draft.title === 'string' ? draft.title : 'Aufgabe'} · Entwurf anzeigen
                </summary>
                <p className="mt-2">{reasons[failure.reason]}</p>
                <dl className="space-y-1">
                  {typeof draft.title === 'string' && (
                    <div>
                      <dt className="font-medium">Titel</dt>
                      <dd>{draft.title}</dd>
                    </div>
                  )}
                  {typeof draft.description === 'string' && (
                    <div>
                      <dt className="font-medium">Beschreibung</dt>
                      <dd className="whitespace-pre-wrap">{draft.description}</dd>
                    </div>
                  )}
                  {'description' in draft && draft.description === null && (
                    <div>
                      <dt>Beschreibung</dt>
                      <dd>Keine Beschreibung</dd>
                    </div>
                  )}
                  {'due_date' in draft && (
                    <div>
                      <dt>Fällig</dt>
                      <dd>
                        {typeof draft.due_date === 'string'
                          ? new Date(draft.due_date).toLocaleString('de-DE')
                          : 'Kein Fälligkeitsdatum'}
                      </dd>
                    </div>
                  )}
                  {'status' in draft && (
                    <div>
                      <dt>Status</dt>
                      <dd>{draft.status === 'done' ? 'Erledigt' : 'Offen'}</dd>
                    </div>
                  )}
                  {'assignee_id' in draft && (
                    <div>
                      <dt>Zuweisung</dt>
                      <dd>
                        {typeof draft.assignee_id === 'string'
                          ? 'Zugewiesene Person gespeichert'
                          : 'Niemandem zugewiesen'}
                      </dd>
                    </div>
                  )}
                </dl>
              </details>
            )
          })}
        </div>
      )}
    </section>
  )
}
