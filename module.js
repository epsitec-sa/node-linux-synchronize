const mutexAddon = require("./build/Release/mutex");

const mutexNameMaxLength = 31;
const mutexLocked = 35;
const tryAgain = 11;

function createMutex(name, fileMode) {
  if (name.length > mutexNameMaxLength) {
    throw `mutex name length cannot be greater than ${mutexNameMaxLength}`;
  }

  const handle = Buffer.alloc(mutexAddon.sizeof_MutexHandle);

  const res = mutexAddon.CreateMutex(name, fileMode, handle);

  if (res !== 0) {
    throw `could not create mutex for object ${name}: ${res}`;
  }

  return handle;
}

function openMutex(name) {
  if (name.length > mutexNameMaxLength) {
    throw `mutex name length cannot be greater than ${mutexNameMaxLength}`;
  }

  const handle = Buffer.alloc(mutexAddon.sizeof_MutexHandle);

  const res = mutexAddon.OpenMutex(name, handle);

  if (res !== 0) {
    throw `could not open mutex for object ${name}: ${res}`;
  }

  return handle;
}

function tryLockMutex(handle) {
  const res = mutexAddon.TryLockMutex(handle);

  if (res === mutexLocked || res === tryAgain) {
    throw `mutex is already locked`;
  } else if (res !== 0) {
    throw `could not wait for mutex: ${res}`;
  }
}

function waitMutexAsync(handle, waitMs, callback) {
  setImmediate(() => _waitMutexAsync(handle, waitMs, callback));
}

function _waitMutexAsync(handle, remainingTimeout, callback) {
  const res = mutexAddon.TryLockMutex(handle);
  if (res === 0) {
    callback();
  }

  if (res === mutexLocked || res === tryAgain) {
    if (remainingTimeout <= 0) {
      callback(`mutex timeout expired`);
    } else {
      setTimeout(
        () => _waitMutexAsync(handle, remainingTimeout - 20, callback),
        20
      );
    }
  } else if (res !== 0) {
    callback(`could not wait for mutex: ${res}`);
  }
}

function releaseMutex(handle) {
  const res = mutexAddon.ReleaseMutex(handle);

  if (res !== 0) {
    throw `could not release mutex: ${res}`;
  }
}

function closeMutex(handle) {
  mutexAddon.CloseMutex(handle);
}

module.exports = {
  createMutex,
  openMutex,
  tryLockMutex,
  waitMutexAsync,
  releaseMutex,
  closeMutex,

  mutexFileMode: {
    S_IRWXU: 0o700 /* [XSI] RWX mask for owner */,
    S_IRUSR: 0o400 /* [XSI] R for owner */,
    S_IWUSR: 0o200 /* [XSI] W for owner */,
    S_IXUSR: 0o100 /* [XSI] X for owner */,

    /* Read, write, execute/search by group */
    S_IRWXG: 0o70 /* [XSI] RWX mask for group */,
    S_IRGRP: 0o40 /* [XSI] R for group */,
    S_IWGRP: 0o20 /* [XSI] W for group */,
    S_IXGRP: 0o10 /* [XSI] X for group */,

    /* Read, write, execute/search by others */
    S_IRWXO: 0o7 /* [XSI] RWX mask for other */,
    S_IROTH: 0o4 /* [XSI] R for other */,
    S_IWOTH: 0o2 /* [XSI] W for other */,
    S_IXOTH: 0o1 /* [XSI] X for other */,

    S_ISUID: 0o4000 /* [XSI] set user id on execution */,
    S_ISGID: 0o2000 /* [XSI] set group id on execution */,
    S_ISVTX: 0o1000 /* [XSI] directory restrcted delete */,
  },
};
