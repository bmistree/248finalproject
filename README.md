

To run: place project folder in on webserver and in setup.js change 
DrawingConsts.SERVER_WEBSOCKET_ADDRESS from
'ws://bcoli.stanford.edu:18080/ws' to point to the host/port that you
are running the Taskwald go server.  For example, if you are running
the server locally, you could set it to 'ws://localhost:18080/ws'.
Then, navigate to the page on your browser (tested in Chrome).

All js code is in lib.  The code to procedurally generate the ground
plane is in ground_plane/create_ground_plane.py.

