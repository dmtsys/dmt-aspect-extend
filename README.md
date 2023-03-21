## DMT MIDDLEWARE

### aspect-extend


When developing / adding code to this middleware:

```
git clone git@github.com:dmtsys/dmt-aspect-extend.git ~/somewhere/dmt-aspect-extend

cd ~/.dmt/core/node/

rm -rf aspect-extend

ln -s ~/somewhere/dmt-aspect-extend aspect-extend

```

Symlink will hold until DMT ENGINE update (`dmt next`).

If further changes are needed, symlink again.

Accepted changes should land in uniqpath/dmt main repo in next DMT ENGINE update.

There is no reason to symlink again until further experimentation is needed.

```
rm -rf  ~/somewhere/dmt-aspect-extend
```
