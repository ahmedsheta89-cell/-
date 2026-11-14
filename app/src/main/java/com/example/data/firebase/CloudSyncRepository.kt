package com.example.data.firebase

import android.content.Context
import com.example.R
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

@IgnoreExtraProperties
data class StudySyncRecord(
    @DocumentId val id: String = "",
    val userId: String = "",
    val recordType: String = "lesson_progress",
    val title: String = "",
    val referenceKey: String = "",
    val scoreOrCount: Long = 0L,
    val notes: String? = null,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

class CloudSyncRepository(private val db: FirebaseFirestore) {

    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private val auth = Firebase.auth

    private fun requireUserId(): String {
        return auth.currentUser?.uid
            ?: throw FirebaseFirestoreException(
                "User must be signed in with Google before accessing Firestore.",
                FirebaseFirestoreException.Code.PERMISSION_DENIED
            )
    }

    suspend fun createRecord(
        recordType: String,
        title: String,
        referenceKey: String,
        scoreOrCount: Long,
        notes: String? = null
    ): Result<String> = runCatching {
        val uid = requireUserId()
        val colRef = db.collection("users").document(uid).collection("study_records")
        val docRef = colRef.document()
        val payload = mutableMapOf<String, Any>(
            "userId" to uid,
            "recordType" to recordType,
            "title" to title.take(200),
            "referenceKey" to referenceKey.take(120),
            "scoreOrCount" to scoreOrCount.coerceIn(0L, 100000L),
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (!notes.isNullOrBlank()) {
            payload["notes"] = notes.take(2000)
        }
        try {
            docRef.set(payload).await()
            docRef.id
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, docRef.path)
            throw e
        }
    }

    suspend fun getUserRecords(): Result<List<StudySyncRecord>> = runCatching {
        val uid = requireUserId()
        val path = "users/$uid/study_records"
        try {
            val snapshot = db.collection("users").document(uid).collection("study_records")
                .get()
                .await()
            snapshot.toObjects(
                StudySyncRecord::class.java,
                DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.LIST, path)
            throw e
        }
    }

    suspend fun getRecordById(ownerUid: String, recordId: String): Result<StudySyncRecord?> = runCatching {
        val path = "users/$ownerUid/study_records/$recordId"
        try {
            val doc = db.collection("users").document(ownerUid)
                .collection("study_records").document(recordId)
                .get()
                .await()
            doc.toObject(
                StudySyncRecord::class.java,
                DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.GET, path)
            throw e
        }
    }

    fun observeRecords(): Flow<List<StudySyncRecord>> = flow {
        val authUid = auth.currentUser?.uid
        val targetUid = authUid ?: "unauthenticated_probe"
        val path = "users/$targetUid/study_records"
        emitAll(
            db.collection("users").document(targetUid).collection("study_records")
                .snapshots()
                .map { snapshot ->
                    snapshot.toObjects(
                        StudySyncRecord::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    )
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val exceptionToLog = firestoreError ?: (error as? Exception)
                    if (exceptionToLog != null && auth.currentUser?.uid == authUid) {
                        handleFirestoreError(exceptionToLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun deleteRecord(recordId: String): Result<Unit> = runCatching {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid)
            .collection("study_records").document(recordId)
        try {
            docRef.delete().await()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docRef.path)
            throw e
        }
    }
}
