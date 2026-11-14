const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";

const [emulatorHost, emulatorPortStr] = (
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085"
).split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user: cannot read or list study_records", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(
    unauthDb.collection("users").doc(ALICE_UID).collection("study_records").get()
  );
});

test("Authenticated user: can create and list their own study_records", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date();
  await assertSucceeds(
    aliceDb
      .collection("users")
      .doc(ALICE_UID)
      .collection("study_records")
      .doc("rec_1")
      .set({
        userId: ALICE_UID,
        recordType: "lesson_progress",
        title: "مخارج الحروف السبعة عشر",
        referenceKey: "tajweed_lesson_1",
        scoreOrCount: 95,
        notes: "تم إتمام الدرس بنجاح",
        createdAt: now,
        updatedAt: now,
      })
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("study_records").get()
  );
});

test("Authenticated user: cannot read or write another user's study_records", async () => {
  const now = new Date();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection("users")
      .doc(BOB_UID)
      .collection("study_records")
      .doc("bob_rec_1")
      .set({
        userId: BOB_UID,
        recordType: "certificate",
        title: "شهادة إتمام التجويد",
        referenceKey: "ITQAN-CERT-001",
        scoreOrCount: 90,
        createdAt: now,
        updatedAt: now,
      });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(
    aliceDb
      .collection("users")
      .doc(BOB_UID)
      .collection("study_records")
      .doc("bob_rec_1")
      .get()
  );
  await assertFails(
    aliceDb.collection("users").doc(BOB_UID).collection("study_records").get()
  );
});

test("Shadow update & invalid enum rejection: rejects ghost fields and invalid recordType", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date();
  await assertFails(
    aliceDb
      .collection("users")
      .doc(ALICE_UID)
      .collection("study_records")
      .doc("rec_invalid")
      .set({
        userId: ALICE_UID,
        recordType: "invalid_type",
        title: "Test",
        referenceKey: "ref_1",
        scoreOrCount: 50,
        createdAt: now,
        updatedAt: now,
      })
  );

  await assertFails(
    aliceDb
      .collection("users")
      .doc(ALICE_UID)
      .collection("study_records")
      .doc("rec_ghost")
      .set({
        userId: ALICE_UID,
        recordType: "bookmark",
        title: "سورة البقرة آية الكرسي",
        referenceKey: "2:255",
        scoreOrCount: 1,
        isAdmin: true,
        createdAt: now,
        updatedAt: now,
      })
  );
});
