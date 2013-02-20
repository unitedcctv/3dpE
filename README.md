3dpE
====

Web based UI for operating 3d printers

Get yourself a RaspberryPI with 
Get yourself a copy of Nodejs
apt-get install node-js git
#install npm
curl https://npmjs.org/install.sh | sh

#get printerface
cd /home/pi
git clone git://github.com/w-A-L-L-e/printerface.git

#forever keeps our printerface running even if it crashes, and creates a logfile while we're at it...
sudo npm install -g forever@0.9.2

#now actually fire it up, put this line in /etc/rc.local to have it on boot
cd /home/pi/printerface && forever start printerface.js