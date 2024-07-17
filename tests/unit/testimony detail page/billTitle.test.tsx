import { render, screen } from "@testing-library/react"
import { Bill, draftAttachment } from "components/db"
import { Timestamp } from "firebase/firestore"
import { Provider } from "react-redux"
import configureStore from "redux-mock-store"
import { thunk } from "redux-thunk"
import { BillTitle } from "components/testimony/TestimonyDetailPage/BillTitle"

// mock bill (later used in redux store)
const mockBill: Bill = {
  id: "A1234",
  court: 193,
  content: {
    BillNumber: "A1234",
    PrimarySponsor: {
      Name: "Primary Sponsor",
      Id: "ABC1",
      Type: 1
    },
    DocketNumber: "AB1234",
    Title: "Content Title",
    DocumentText: "Document Text",
    LegislationTypeName: "Bill",
    Pinslip: "Pinslip",
    Cosponsors: [
      {
        Type: 1,
        Id: "ABC1",
        Name: "Primary Sponsor"
      },
      {
        Type: 1,
        Id: "AAAA",
        Name: "Second Sponsor"
      },
      {
        Type: 1,
        Id: "BBBB",
        Name: "Third Sponsor"
      },
      {
        Type: 1,
        Id: "CCCC",
        Name: "Fourth Sponsor"
      }
    ],
    GeneralCourtNumber: 193
  },
  cosponsorCount: 4,
  testimonyCount: 2,
  endorseCount: 2,
  opposeCount: 0,
  neutralCount: 0,
  nextHearingAt: new Timestamp(1680616800, 0),
  latestTestimonyAt: new Timestamp(1718147489, 987000000),
  latestTestimonyId: "Xy7dkT90nmLVac56pq_ZW",
  fetchedAt: new Timestamp(1718811579, 935000000),
  history: [
    {
      Action: "History Action 1",
      Branch: "Senate",
      Date: "2023-02-16T11:17:15.563"
    },
    {
      Branch: "House",
      Date: "2023-02-16T11:17:15.563",
      Action: "History Action 2"
    },
    {
      Date: "2023-03-29T16:13:01.983",
      Action: "History Action 3",
      Branch: "Joint"
    },
    {
      Action: "Last History Action",
      Date: "2023-07-13T00:00:00",
      Branch: "Senate"
    }
  ],
  city: "Sample City"
}

// set up Redux mock store with thunk middleware bc resolveBill is thunk
const mockStore = configureStore([thunk])


describe("BillTitle", () => {
  let store: ReturnType<typeof mockStore>
  const { content } = mockBill
  const { Title } = content
  beforeEach(() => {
    store = mockStore({
      auth: {
        authenticated: false,
        user: null,
        claims: null
      },
      publish: {
        service: {},
        showThankYou: false,
        bill: mockBill
      },
      testimonyDetail : {
        data: {
          testimony: {
            billTitle:"An Act to implement the recommendations of the special commission on facial recognition technology",
            position:"endorse",
            content:"I support S.927! It implements necessary measures to ensure privacy and prevent misuse of facial recognition technology, including requiring warrants for searches, centralizing its use at the State Police, and providing due process protections.",
            id: "U8XW55NSyAWBoe0BgIK8u",
            draftAttachmentId: null,
            authorRole:"user",
            authorUid:"5kOrtIaa5XWIHd5syHWVBYhDpx53",
            fullName:"葉歡鋒",
            court:193,
            attachmentId:null,
            authorDisplayName:"葉歡鋒",
            representativeId:"DWG1",
            billId:"S927",
            senatorId:"BPC0",
            publishedAt: {},
            version: 1
          },
          bill: null,
          author: null,
          archive: null,
          version: 1
        },
        selectedVersion: 1,
        authorUid: "5kOrtIaa5XWIHd5syHWVBYhDpx53",
        billId: "S927",
        court: 193
      }
    })
    render(<Provider store={store}>
      <BillTitle />
    </Provider>)
      it("should render title of bill properly", () => {
        ///should be able to render the title of the bill correctly
  })
})
