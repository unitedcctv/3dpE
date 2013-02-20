3dpE
====

Web based UI for operating 3d printers

Get yourself a RaspberryPI with 
Get yourself a copy of Nodejs and npm

cd /home/pi
git clone git://github.com/unitedcctv/3dpE.git

forever keeps our printerface running even if it crashes, and creates a logfile.
sudo npm install -g forever@0.9.2

start server
cd /home/pi/3dpE/server && forever start server.js
put this line in /etc/rc.local to start it when the RPi boot.