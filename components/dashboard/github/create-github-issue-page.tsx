'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckSquare2, FilePenLine, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { useDraftGithubIssue, useSuggestGithubLabels } from '@/hooks/use-github-ai'
import { SectionHeader } from '@/components/dashboard/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useCreateGithubIssue } from '@/hooks/use-github-issues'
import { useGithubRepositories } from '@/hooks/use-github-repositories'
import {
  defaultGitHubIssueTemplate,
  issueTemplates,
} from '@/lib/github/issue-templates'
import {
  githubIssueFormSchema,
  type GitHubIssueFormValues,
} from '@/lib/validators/github-issue'

export function CreateGithubIssuePage({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  const router = useRouter()
  const createIssue = useCreateGithubIssue()
  const draftIssue = useDraftGithubIssue()
  const suggestLabels = useSuggestGithubLabels()
  const { data: repositoryData } = useGithubRepositories()
  const previousTemplateRef = useRef(defaultGitHubIssueTemplate)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [labelSuggestions, setLabelSuggestions] = useState<
    Array<{ label: string; reason: string }>
  >([])

  const form = useForm<GitHubIssueFormValues>({
    resolver: zodResolver(githubIssueFormSchema),
    defaultValues: {
      template: defaultGitHubIssueTemplate,
      title: issueTemplates[defaultGitHubIssueTemplate].titlePrefix,
      body: issueTemplates[defaultGitHubIssueTemplate].body,
    },
  })

  const selectedTemplate = useWatch({
    control: form.control,
    name: 'template',
  })
  const repository =
    repositoryData?.repositories.find(
      (candidate) => candidate.full_name === `${owner}/${repo}`
    ) ?? null

  useEffect(() => {
    const previousTemplate = previousTemplateRef.current
    const previousTemplateContent = issueTemplates[previousTemplate]
    const nextTemplateContent = issueTemplates[selectedTemplate]
    const currentBody = form.getValues('body')
    const currentTitle = form.getValues('title')

    if (!currentBody || currentBody === previousTemplateContent.body) {
      form.setValue('body', nextTemplateContent.body, {
        shouldDirty: true,
      })
    }

    if (
      !currentTitle ||
      currentTitle === previousTemplateContent.titlePrefix ||
      currentTitle.startsWith(previousTemplateContent.titlePrefix)
    ) {
      const titleWithoutPrefix = currentTitle.startsWith(
        previousTemplateContent.titlePrefix
      )
        ? currentTitle
            .slice(previousTemplateContent.titlePrefix.length)
            .trimStart()
        : ''

      form.setValue(
        'title',
        `${nextTemplateContent.titlePrefix}${titleWithoutPrefix}`,
        {
          shouldDirty: true,
        }
      )
    }

    previousTemplateRef.current = selectedTemplate
  }, [form, selectedTemplate])

  async function onSubmit(values: GitHubIssueFormValues) {
    try {
      const response = await createIssue.mutateAsync({
        owner,
        repo,
        title: values.title,
        body: values.body,
        labels: selectedLabels,
      })

      toast.success(`Issue #${response.issue.number} created successfully.`)
      router.push(`/repos/${owner}/${repo}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create issue'
      )
    }
  }

  async function handleSuggestLabels() {
    const values = form.getValues()

    try {
      const response = await suggestLabels.mutateAsync({
        owner,
        repo,
        template: values.template,
        title: values.title,
        body: values.body,
      })

      setLabelSuggestions(response.suggestions)
      setSelectedLabels(response.suggestions.map((suggestion) => suggestion.label))

      if (response.suggestions.length) {
        toast.success('AI label suggestions are ready.')
      } else {
        toast.message('No strong label suggestions found for this issue.')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to suggest labels'
      )
    }
  }

  async function handleGenerateDraft() {
    const values = form.getValues()

    try {
      const response = await draftIssue.mutateAsync({
        repository: `${owner}/${repo}`,
        template: values.template,
        title: values.title,
        currentBody: values.body,
      })

      form.setValue('body', response.body, {
        shouldDirty: true,
        shouldTouch: true,
      })

      toast.success(
        values.body.trim()
          ? 'Issue draft improved with Gemini.'
          : 'Issue draft generated with Gemini.'
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to generate issue draft'
      )
    }
  }

  function toggleLabel(label: string) {
    setSelectedLabels((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    )
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="New GitHub Issue"
        title={`Create an issue for ${owner}/${repo}`}
        description={
          repository?.description ??
          'Pick a template, fill in the details, and send a new issue directly to GitHub.'
        }
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/repos/${owner}/${repo}`}>
              <ArrowLeft className="size-4" />
              Back to issues
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Issue template</CardTitle>
            <CardDescription>
              Start with the template that best matches the work you want to
              capture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(issueTemplates).map(([templateKey, template]) => {
              const isSelected = selectedTemplate === templateKey

              return (
                <button
                  key={templateKey}
                  type="button"
                  onClick={() =>
                    form.setValue(
                      'template',
                      templateKey as GitHubIssueFormValues['template']
                    )
                  }
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{template.label}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {template.description}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckSquare2 className="size-5 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <CheckSquare2 className="text-muted-foreground size-5" />
                    )}
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/80 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-none">
          <CardHeader>
            <CardTitle>Issue details</CardTitle>
            <CardDescription>
              This form uses the selected template as a starting point, and you
              can edit every field before submitting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="Summarize the issue"
                  {...form.register('title')}
                />
                {form.formState.errors.title ? (
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-sm font-medium" htmlFor="body">
                    Description
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={draftIssue.isPending}
                    onClick={handleGenerateDraft}
                  >
                    {draftIssue.isPending ? (
                      <>
                        <Spinner />
                        Writing...
                      </>
                    ) : (
                      <>
                        <FilePenLine className="size-4" />
                        {form.getValues('body').trim()
                          ? 'Improve draft'
                          : 'Generate draft'}
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  id="body"
                  rows={16}
                  className="placeholder:text-muted-foreground w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-emerald-500/40 dark:focus:ring-emerald-500/20"
                  placeholder="Describe the issue"
                  {...form.register('body')}
                />
                {form.formState.errors.body ? (
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {form.formState.errors.body.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">AI label suggestions</p>
                    <p className="text-sm text-muted-foreground">
                      Let Gemini review this issue draft and recommend the most relevant GitHub labels.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={suggestLabels.isPending}
                    onClick={handleSuggestLabels}
                  >
                    {suggestLabels.isPending ? (
                      <>
                        <Spinner />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Suggest labels
                      </>
                    )}
                  </Button>
                </div>

                {labelSuggestions.length ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {labelSuggestions.map((suggestion) => {
                        const isSelected = selectedLabels.includes(suggestion.label)

                        return (
                          <button
                            key={suggestion.label}
                            type="button"
                            onClick={() => toggleLabel(suggestion.label)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              isSelected
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
                                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                            }`}
                          >
                            {suggestion.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="space-y-2">
                      {labelSuggestions.map((suggestion) => (
                        <div
                          key={`${suggestion.label}-reason`}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                          <span className="font-medium">{suggestion.label}</span>
                          <span className="text-muted-foreground">
                            {' '}
                            — {suggestion.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No suggestions yet. Generate them after you’ve written a meaningful draft.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={createIssue.isPending}
                >
                  {createIssue.isPending ? (
                    <>
                      <Spinner />
                      Creating issue...
                    </>
                  ) : (
                    'Create issue'
                  )}
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/repos/${owner}/${repo}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
