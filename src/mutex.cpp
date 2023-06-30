#include <node_api.h>
#include <napi-macros.h>

#include <fcntl.h> // for flags O_CREAT etc..
#include <stdio.h>
#include <string.h>
#include <semaphore.h>
#include <errno.h>

#define MTX_NAME_MAX 31
#define MTX_FLAGS_CREATE (O_CREAT | O_EXCL)
#define MTX_FLAGS_OPEN (0)

struct MutexHandle
{
    char name[MTX_NAME_MAX];
    sem_t *pSemaphore;
};

// string name, int mutexFileMode, MutexHandle* mutexHandle -> int
NAPI_METHOD(CreateMutex)
{
    int result = 0;

    NAPI_ARGV(3)

    NAPI_ARGV_UTF8(mutexName, 1000, 0)
    NAPI_ARGV_INT32(mutexFileMode, 1)
    NAPI_ARGV_BUFFER_CAST(struct MutexHandle *, mutexHandle, 2)

    mutexHandle->pSemaphore = sem_open(mutexName, MTX_FLAGS_CREATE, mutexFileMode, 1);
    if (mutexHandle->pSemaphore == SEM_FAILED)
    {
        if (errno == EEXIST)
        { // mutex already exists (has not been unlinked and is abandoned)
            printf("mutex is abandoned\n");
            if (sem_unlink(mutexName) != 0)
            {
                NAPI_RETURN_INT32(errno)
            }
            mutexHandle->pSemaphore = sem_open(mutexName, MTX_FLAGS_CREATE, mutexFileMode, 1);
            if (mutexHandle->pSemaphore == SEM_FAILED)
            {
                NAPI_RETURN_INT32(errno)
            }
        }
        else
        {
            NAPI_RETURN_INT32(errno)
        }
    }

    strcpy(mutexHandle->name, mutexName);

    NAPI_RETURN_INT32(result)
}

// string name, MutexHandle* mutexHandle -> int
NAPI_METHOD(OpenMutex)
{
    int result = 0;

    NAPI_ARGV(2)

    NAPI_ARGV_UTF8(mutexName, 1000, 0)
    NAPI_ARGV_BUFFER_CAST(struct MutexHandle *, mutexHandle, 1)

    mutexHandle->pSemaphore = sem_open(mutexName, MTX_FLAGS_OPEN, S_IRUSR, 1);
    if (mutexHandle->pSemaphore == SEM_FAILED)
    {
        NAPI_RETURN_INT32(errno)
    }

    strcpy(mutexHandle->name, mutexName);

    NAPI_RETURN_INT32(result)
}

// MutexHandle* mutexHandle-> int
NAPI_METHOD(TryLockMutex)
{
    int result = 0;

    NAPI_ARGV(1)

    NAPI_ARGV_BUFFER_CAST(struct MutexHandle *, mutexHandle, 0)

    int res = sem_trywait(mutexHandle->pSemaphore);
    if (res != 0)
    {
        NAPI_RETURN_INT32(errno)
    }

    NAPI_RETURN_INT32(result)
}

// MutexHandle* mutexHandle -> int
NAPI_METHOD(ReleaseMutex)
{
    int result = 0;

    NAPI_ARGV(1)

    NAPI_ARGV_BUFFER_CAST(struct MutexHandle *, mutexHandle, 0)

    if (sem_post(mutexHandle->pSemaphore) != 0)
    {
        NAPI_RETURN_INT32(errno)
    }
    NAPI_RETURN_INT32(result)
}

// MutexHandle* mutexHandle -> int
NAPI_METHOD(CloseMutex)
{
    int result = 0;

    NAPI_ARGV(1)

    NAPI_ARGV_BUFFER_CAST(struct MutexHandle *, mutexHandle, 0)

    // close the file descriptor
    if (sem_close(mutexHandle->pSemaphore) != 0)
    {
        NAPI_RETURN_INT32(errno)
    }

    if (sem_unlink(mutexHandle->name) != 0)
    {
        NAPI_RETURN_INT32(errno)
    }

    NAPI_RETURN_INT32(result)
}

NAPI_INIT()
{
    NAPI_EXPORT_FUNCTION(CreateMutex)
    NAPI_EXPORT_FUNCTION(OpenMutex)
    NAPI_EXPORT_FUNCTION(TryLockMutex)
    NAPI_EXPORT_FUNCTION(ReleaseMutex)
    NAPI_EXPORT_FUNCTION(CloseMutex)

    NAPI_EXPORT_SIZEOF_STRUCT(MutexHandle)
    NAPI_EXPORT_ALIGNMENTOF(MutexHandle)
}