package com.example.data.firebase

import com.example.base.FirestoreEmulatorTestBase
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CloudSyncRepositoryRuleTest : FirestoreEmulatorTestBase() {

    @Test
    fun createAndGetUserRecords_authenticatedOwner_succeeds() = runBlocking {
        signInTestUser(ALICE_EMAIL)
        val repository = CloudSyncRepository(firestore)

        val createResult = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.createRecord(
                recordType = "lesson_progress",
                title = "مخارج الحروف السبعة عشر",
                referenceKey = "tajweed_lesson_1",
                scoreOrCount = 95L,
                notes = "إتمام الدرس الأول"
            )
        }
        assertTrue(createResult.isSuccess)
        val recordId = createResult.getOrThrow()
        assertTrue(recordId.isNotEmpty())

        val recordsResult = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.getUserRecords()
        }
        assertTrue(recordsResult.isSuccess)
        assertTrue(recordsResult.getOrThrow().any { it.id == recordId })
    }

    @Test
    fun observeRecords_authenticatedOwner_emitsRealtimeUpdates() = runBlocking {
        signInTestUser(ALICE_EMAIL)
        val repository = CloudSyncRepository(firestore)
        val recordId = withTimeout(DEFAULT_TIMEOUT_MS) {
            repository.createRecord(
                recordType = "certificate",
                title = "شهادة إتمام دراسة منهجية",
                referenceKey = "ITQAN-2026-001",
                scoreOrCount = 92L
            ).getOrThrow()
        }

        val emitted = withTimeout(FLOW_TIMEOUT_MS) {
            repository.observeRecords().first { list -> list.any { it.id == recordId } }
        }
        assertTrue(emitted.any { it.id == recordId })
    }

    @Test
    fun getRecordById_crossUserAccess_failsWithPermissionDenied() = runBlocking {
        val aliceUid = signInTestUser(ALICE_EMAIL)
        val aliceRepo = CloudSyncRepository(firestore)
        val recordId = withTimeout(DEFAULT_TIMEOUT_MS) {
            aliceRepo.createRecord(
                recordType = "bookmark",
                title = "آية الكرسي",
                referenceKey = "2:255",
                scoreOrCount = 1L
            ).getOrThrow()
        }

        signInTestUser(BOB_EMAIL)
        val bobRepo = CloudSyncRepository(firestore)
        val result = withTimeout(DEFAULT_TIMEOUT_MS) {
            bobRepo.getRecordById(aliceUid, recordId)
        }
        assertTrue(result.isFailure)
        val firestoreEx = result.exceptionOrNull()?.unwrapFirestoreException()
        assertNotNull(firestoreEx)
        assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, firestoreEx?.code)
    }

    @Test
    fun observeRecords_unauthenticatedUser_failsWithPermissionDenied() = runBlocking {
        auth.signOut()
        val repository = CloudSyncRepository(firestore)

        var caught: Throwable? = null
        try {
            withTimeout(FLOW_TIMEOUT_MS) {
                repository.observeRecords().first()
            }
        } catch (e: Throwable) {
            caught = e
        }
        assertNotNull(caught)
        val firestoreEx = caught?.unwrapFirestoreException()
        assertNotNull(firestoreEx)
        assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED, firestoreEx?.code)
    }

    private companion object {
        const val ALICE_EMAIL = "alice@itqan.test"
        const val BOB_EMAIL = "bob@itqan.test"
        const val DEFAULT_TIMEOUT_MS = 5000L
        const val FLOW_TIMEOUT_MS = 3000L
    }
}
