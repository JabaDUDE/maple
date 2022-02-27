import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  DocumentReference,
  onSnapshot,
  updateDoc
} from "firebase/firestore"
import { Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"
import { useAsyncCallback } from "react-async-hook"
import { firestore } from "../../firebase"
import { currentGeneralCourt } from "../common"
import { resolveBillTestimony } from "./resolveTestimony"
import {
  deleteTestimony,
  DraftTestimony,
  publishTestimony,
  Testimony
} from "./types"

export type UseEditTestimony = ReturnType<typeof useEditTestimony>

/**
 * Load, save, and publish testimony for a particular user and bill.
 *
 * The initial `uid` and `billId` are used for the lifetime of the hook
 */
export function useEditTestimony(uid: string, billId: string) {
  const [state, dispatch] = useReducer(reducer, {
    draftLoading: true,
    publicationLoading: true,
    uid,
    billId
  })

  useTestimony(state, dispatch)
  const saveDraft = useSaveDraft(state, dispatch)
  const discardDraft = useDiscardDraft(state, dispatch)
  const publishTestimony = usePublishTestimony(state, dispatch)
  const deleteTestimony = useDeleteTestimony(state, dispatch)
  const { draft, error, draftLoading, publicationLoading, publication } = state

  return useMemo(
    () => ({
      saveDraft,
      discardDraft,
      publishTestimony,
      deleteTestimony,
      draft,
      error,
      loading: draftLoading || publicationLoading,
      publication
    }),
    [
      deleteTestimony,
      discardDraft,
      draft,
      draftLoading,
      error,
      publication,
      publicationLoading,
      publishTestimony,
      saveDraft
    ]
  )
}

function useTestimony(
  { uid, billId, draftRef, publicationRef }: State,
  dispatch: Dispatch<Action>
) {
  useEffect(() => {
    resolveBillTestimony(uid, billId)
      .then(({ draft, publication }) => {
        dispatch({ type: "resolveDraft", id: draft?.id })
        dispatch({ type: "resolvePublication", id: publication?.id })
      })
      .catch(error => dispatch({ type: "error", error }))
  }, [billId, dispatch, uid])

  useEffect(() => {
    if (draftRef)
      return onSnapshot(draftRef, {
        next: snap =>
          snap.exists() &&
          dispatch({ type: "loadDraft", value: snap.data() as DraftTestimony }),
        error: error => dispatch({ type: "error", error })
      })
  }, [dispatch, draftRef])

  useEffect(() => {
    if (publicationRef)
      return onSnapshot(publicationRef, {
        next: snap =>
          snap.exists() &&
          dispatch({
            type: "loadPublication",
            value: snap.data() as Testimony
          }),
        error: error => dispatch({ type: "error", error })
      })
  })
}

function usePublishTestimony(
  { draft, draftRef }: State,
  dispatch: Dispatch<Action>
) {
  return useAsyncCallback(
    useCallback(async () => {
      if (draftRef && draft && !draft.publishedVersion) {
        const result = await publishTestimony({ draftId: draftRef.id })
        dispatch({ type: "resolvePublication", id: result.data.publicationId })
      }
    }, [dispatch, draft, draftRef]),
    { onError: error => dispatch({ type: "error", error }) }
  )
}

function useDeleteTestimony(
  { publicationRef }: State,
  dispatch: Dispatch<Action>
) {
  return useAsyncCallback(
    useCallback(async () => {
      if (publicationRef) {
        const result = await deleteTestimony({
          publicationId: publicationRef.id
        })
        if (result.data.deleted) dispatch({ type: "deletePublication" })
      }
    }, [dispatch, publicationRef]),
    { onError: error => dispatch({ type: "error", error }) }
  )
}

function useDiscardDraft({ draftRef }: State, dispatch: Dispatch<Action>) {
  return useAsyncCallback(
    useCallback(async () => {
      if (draftRef) {
        await deleteDoc(draftRef)
        dispatch({ type: "discardDraft" })
      }
    }, [dispatch, draftRef]),
    { onError: error => dispatch({ type: "error", error }) }
  )
}

function useSaveDraft(
  { draft, draftRef, draftLoading, billId, uid }: State,
  dispatch: Dispatch<Action>
) {
  return useAsyncCallback(
    useCallback(
      async ({
        position,
        content
      }: Pick<DraftTestimony, "position" | "content">) => {
        if (draftLoading) {
          return
        } else if (!draftRef) {
          const newDraft: DraftTestimony = {
            billId,
            content,
            court: currentGeneralCourt,
            position
          }
          const result = await addDoc(
            collection(firestore, `/users/${uid}/draftTestimony`),
            newDraft
          )
          dispatch({ type: "resolveDraft", id: result.id })
        } else if (draftRef) {
          await updateDoc(draftRef, {
            position,
            content,
            publishedVersion: deleteField()
          })
          dispatch({ type: "loadingDraft" })
        }
      },
      [billId, dispatch, draftLoading, draftRef, uid]
    ),
    { onError: error => dispatch({ type: "error", error }) }
  )
}

type State = {
  uid: string
  billId: string
  error?: Error

  draft?: DraftTestimony
  draftRef?: DocumentReference
  draftLoading: boolean

  publication?: Testimony
  publicationRef?: DocumentReference
  publicationLoading: boolean
}

type Action =
  | { type: "error"; error: Error }
  | { type: "loadDraft"; value: DraftTestimony }
  | { type: "loadPublication"; value: Testimony }
  | { type: "deletePublication" }
  | { type: "discardDraft" }
  | { type: "resolveDraft"; id?: string }
  | { type: "resolvePublication"; id?: string }
  | { type: "loadingDraft" }

function reducer(state: State, action: Action): State {
  // console.info("useEditTestimony", action)
  switch (action.type) {
    case "error":
      console.warn("Error in useEditTestimony", action.error)
      return { ...state, error: action.error }
    case "loadPublication":
      return { ...state, publication: action.value, publicationLoading: false }
    case "loadDraft":
      return { ...state, draft: action.value, draftLoading: false }
    case "loadingDraft":
      return { ...state, draftLoading: true }
    case "deletePublication":
      return {
        ...state,
        publicationLoading: false,
        publicationRef: undefined,
        publication: undefined
      }
    case "discardDraft":
      return {
        ...state,
        draftLoading: false,
        draftRef: undefined,
        draft: undefined
      }
    case "resolveDraft": {
      return {
        ...state,
        draftRef: action.id
          ? doc(firestore, `/users/${state.uid}/draftTestimony/${action.id}`)
          : undefined,
        draftLoading: !!action.id,
        draft: undefined
      }
    }
    case "resolvePublication": {
      return {
        ...state,
        publication: undefined,
        publicationLoading: !!action.id,
        publicationRef: action.id
          ? doc(firestore, `users/${state.uid}/publishedTestimony/${action.id}`)
          : undefined
      }
    }
  }
}
