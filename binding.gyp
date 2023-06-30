{
  "targets": [
    {
      "target_name": "mutex",
      "include_dirs": [
          "<!(node -e \"require('napi-macros')\")"
      ],
      "sources": [ "./src/mutex.cpp" ],
      "libraries": [],
    }
  ]
}