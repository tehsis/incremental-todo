B=browserify
TRANSFORMS=babelify
OUTDIR=dst
OUT=$(OUTDIR)/incremental-todo.js

all: build

build: $(OUT)

$(OUT): dst
	$(B) src/index.js -t $(TRANSFORMS) --outfile $(OUT)

dst:
	mkdir dst

clean:
	rm -r $(OUTDIR)
