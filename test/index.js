/*global describe,it*/

var assert = require("assert");
const { mutexAccess } = require("../");
var lib = require("../");

describe("CreateMutex", function () {
  it("should create mutex", function () {
    const handle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );

    assert.ok(handle);

    lib.closeMutex(handle);
  });
});

describe("OpenMutex", function () {
  it("should create and open mutex", function () {
    const cHandle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );
    const oHandle = lib.openMutex("/TestMutex");

    assert.ok(cHandle);
    assert.ok(oHandle);

    lib.closeMutex(oHandle);
    lib.closeMutex(cHandle);
  });
});

describe("WaitReleaseMutex", function () {
  it("should create and wait/release mutex", function () {
    const handle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );

    assert.ok(handle);

    lib.tryLockMutex(handle);
    lib.releaseMutex(handle);

    lib.closeMutex(handle);
  });
});

describe("MultipleWaitReleaseMutex", function () {
  it("should create, open and wait/release mutex by multiple instances", function () {
    const cHandle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );
    const oHandle = lib.openMutex("/TestMutex");

    assert.ok(cHandle);
    assert.ok(oHandle);

    lib.tryLockMutex(oHandle);
    lib.releaseMutex(oHandle);

    lib.tryLockMutex(cHandle);
    lib.releaseMutex(cHandle);

    lib.closeMutex(oHandle);
    lib.closeMutex(cHandle);
  });
});

describe("WaitReleaseMutexLocked", function () {
  it("should create, open and wait/release mutex by multiple instances and throw a locked error", function () {
    const cHandle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );
    const oHandle = lib.openMutex("/TestMutex");

    assert.ok(cHandle);
    assert.ok(oHandle);

    lib.tryLockMutex(oHandle);

    assert.throws(() => lib.tryLockMutex(cHandle), /mutex is already locked/);

    lib.releaseMutex(oHandle);

    lib.tryLockMutex(cHandle);
    lib.releaseMutex(cHandle);

    lib.closeMutex(oHandle);
    lib.closeMutex(cHandle);
  });
});

describe("WaitReleaseMutexTimeout", function () {
  it("should create, open and wait/release mutex by multiple instances and throw a timeout error", function (done) {
    const cHandle = lib.createMutex(
      "/TestMutex",
      lib.mutexFileMode.S_IRUSR | lib.mutexFileMode.S_IWUSR
    );
    const oHandle = lib.openMutex("/TestMutex");

    assert.ok(cHandle);
    assert.ok(oHandle);

    lib.tryLockMutex(oHandle);

    lib.waitMutexAsync(cHandle, 300, (err) => {
      if (err !== "mutex timeout expired") {
        done(err);
      } else {
        lib.releaseMutex(oHandle);

        lib.tryLockMutex(cHandle);
        lib.releaseMutex(cHandle);

        lib.closeMutex(oHandle);
        lib.closeMutex(cHandle);

        done();
      }
    });
  });
});
