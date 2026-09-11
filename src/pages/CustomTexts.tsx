import { useState } from 'react'
import { Plus, Pencil, Trash2, FileText, FolderUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDataStore } from '@/store/dataStore'
import { uid } from '@/lib/utils'
import type { Language } from '@/types'
import { Badge } from '@/components/ui/badge'
import { normalizeText } from '@/engine/textGenerator'

interface FormState {
  id: string | null
  title: string
  content: string
  language: Language
}

const emptyForm: FormState = { id: null, title: '', content: '', language: 'en' }

export default function CustomTexts() {
  const customTexts = useDataStore((s) => s.customTexts)
  const addCustomText = useDataStore((s) => s.addCustomText)
  const updateCustomText = useDataStore((s) => s.updateCustomText)
  const deleteCustomText = useDataStore((s) => s.deleteCustomText)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const openNew = () => {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (id: string) => {
    const t = customTexts.find((c) => c.id === id)
    if (!t) return
    setForm({ id: t.id, title: t.title, content: t.content, language: t.language })
    setError(null)
    setOpen(true)
  }

  const save = () => {
    const title = form.title.trim()
    const content = normalizeText(form.content)
    if (!title) {
      setError('Give this text a title.')
      return
    }
    if (content.length < 10) {
      setError('Content must be at least 10 characters.')
      return
    }
    const now = new Date().toISOString()
    if (form.id) {
      updateCustomText({
        id: form.id,
        title,
        content,
        language: form.language,
        createdAt: customTexts.find((c) => c.id === form.id)?.createdAt ?? now,
        updatedAt: now,
      })
    } else {
      addCustomText({ id: uid(), title, content, language: form.language, createdAt: now, updatedAt: now })
    }
    setOpen(false)
    setError(null)
  }

  const handleImportFile = async (file: File | null | undefined) => {
    setImportError(null)
    if (!file) return
    try {
      const text = await file.text()
      const trimmed = text.trim()
      if (trimmed.length < 5) throw new Error('File is empty.')
      if (trimmed.length > 200_000) throw new Error('File is too large.')
      const now = new Date().toISOString()
      addCustomText({
        id: uid(),
        title: file.name.replace(/\.(txt|md)$/i, ''),
        content: normalizeText(trimmed),
        language: 'en',
        createdAt: now,
        updatedAt: now,
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read the file.')
    }
  }

  const deleting = toDelete ? customTexts.find((c) => c.id === toDelete) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Custom texts</h1>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".txt,.md,.text"
              className="sr-only"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <FolderUp className="h-4 w-4" />
                Import .txt
              </span>
            </Button>
          </label>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New text
          </Button>
        </div>
      </div>
      {importError ? <p className="text-sm text-red-400">{importError}</p> : null}

      {customTexts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted">
            <FileText className="h-8 w-8 text-faint" />
            No custom texts yet.
            <p className="text-xs text-faint">
              Create your own text or import a .txt file to practice on. Everything stays local.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {customTexts.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{t.title}</div>
                    <div className="text-xs text-muted">
                      {t.language.toUpperCase()} · {wordCount(t.content)} words ·{' '}
                      {charCount(t.content)} chars
                    </div>
                  </div>
                  <Badge variant="secondary">{t.language.toUpperCase()}</Badge>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-snug text-muted">
                  {t.content}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(t.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => setToDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted hover:text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit text' : 'New custom text'}</DialogTitle>
            <DialogDescription>
              Your text is stored locally and available offline in the Custom mode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-title">Title</Label>
              <Input
                id="ct-title"
                value={form.title}
                placeholder="e.g. My daily notes"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-content">Content</Label>
              <Textarea
                id="ct-content"
                value={form.content}
                placeholder="Paste or write the text you want to practice…"
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={7}
              />
              <p className="text-xs text-faint">
                {charCount(form.content)} characters · {wordCount(form.content)} words
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-language">Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm({ ...form, language: v as Language })}
              >
                <SelectTrigger id="ct-language" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="uz">O‘zbekcha</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{form.id ? 'Save changes' : 'Create text'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(toDelete)} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent className="w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.title}”?</DialogTitle>
            <DialogDescription>
              This removes the custom text from this device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (toDelete) deleteCustomText(toDelete)
                setToDelete(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function wordCount(s: string): number {
  const t = s.trim()
  return t ? t.split(/\s+/).length : 0
}
function charCount(s: string): number {
  return s.length
}