# Laravel Server Change Rule

Before reading, editing, uploading, deploying, migrating, or running an Artisan command for the Laravel project on the live server, first verify that SSH access is working and that the connected host reports `srv1789528`.

Only after this check succeeds, work inside `/var/www/tyng`. If the connection or host check fails, do not make Laravel changes; report the issue and wait for it to be resolved.

After a live Laravel change, verify the relevant result, commit only the files from that task on the server, and push the active branch to its configured remote.
