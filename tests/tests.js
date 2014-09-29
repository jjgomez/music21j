require.config({
    paths: {
        'music21': '../src/music21',
        'q-unit': '../src/ext/qUnit/qunit-1.12.0',
    },
    baseUrl: '../src',
    shim: {
        'q-unit': {
            exports: 'QUnit',
            init: function() {
                QUnit.config.autoload = false;
                QUnit.config.autostart = false;
            }
        } 
     }
});

require(['music21','q-unit'], function () {
    for (var module in music21) {
        if (typeof(music21[module].tests) == 'function') {
            var testSuite = music21[module].tests;
            testSuite();
        }
    }
    QUnit.load();
    QUnit.start();

});

<<<<<<< HEAD
test( "Music21.Dynamic", function() {
    var dynamic = new Music21.Dynamic("pp");
    equal (dynamic.value, "pp", "matching dynamic");
    dynamic = new Music21.Dynamic(.98);
    equal (dynamic.value, "fff", "number conversion successful");
    equal (dynamic.volumeScalar, .98, "correct volume");
    equal (dynamic.longName, "fortississimo", "matching long name");
    equal (dynamic.englishName, "extremely loud", "matching english names");
    dynamic = new Music21.Dynamic("other");
    equal (dynamic.value, "other", "record non standard dynamic");
    equal (dynamic.longName, undefined, "no long name for non standard dynamic");
    equal (dynamic.englishName, undefined, "no english name for non standard dynamic");
    dynamic.value = .18;
    equal (dynamic.value, "pp", "change in dynamic");
    equal (dynamic.volumeScalar, .18, "change in volume");
    dynamic.value = "other";
    equal (dynamic.value, "other", "change to non standard");
    equal (dynamic.longName, undefined, "change to non standard dynamic");
    equal (dynamic.englishName, undefined, "change to non standard dynamic");
});

test( "Music21.Articulation", function() {
    var acc = new Music21.Accent();
    var vex = new Vex.Flow.Articulation("a>");
    equal (acc.name, 'accent', 'matching names for accent');
    equal (acc.vexflow, vex, 'matching vexflow');
    var ten = new Music21.Tenuto();
    equal (ten.name, 'tenuto', 'matching names for tenuto');
    var n = new Music21.Note("C");
    n.articulations.push(acc);
    n.articulations.push(ten);
    equal (n.articulations[0].name, 'accent', 'accent in array');
    equal (n.articulations[1].name, 'tenuto', 'tenuto in array');
});
=======
>>>>>>> upstream/master
