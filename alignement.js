/*global $: false */

/*
 *
 * Javascript pour le grain alignement
 *
 */

var alignement = {
    /** Matrice coût */
    couts: {AA: 0, AT: 1, AG: 1, AC: 1, TA: 1, TT: 0, TG: 1, TC: 1, GA: 1, GT: 1, GG: 0, GC: 1, CA: 1, CT: 1, CG: 1, CC: 0},
    /** Coût d'un gap */
    coutGap: 1,
    /** Sequence 1 */
    x: ["A", "G", "T", "A", "T", "C", "T"],
    /** Sequence 2 */
    y: ["A", "G", "A", "T", "G", "C"],
    /** Liste des lettres */
    lettres: ["A", "T", "G", "C"],
    /** Etape en cours */
    etape: 0,
    /** Liste des messages */
    messages: new Array(10),
    /** Liste des instructions */
    instructions: new Array(6),
    /** Objet du canvas*/
    canvas: null,
    delta: null,
    /** Curseur */
    posX: 0,
    posY: 0,
    /** Matrice des scores*/
    scores: null,
    /** Score optimal */
    optimal: null,
    /** Liste des alignements */
    alignements: [],
    /** Liste des alignements opimaux */
    optimaux: [],
    /** Affiche un message */
    afficherMessage: function (n) {
        'use strict';
        $("#grain-alignement-messagesTitre").html(this.messages[n].titre);
        $("#grain-alignement-messagesContenu").html(this.messages[n].contenu);
    },
    /** Affichage des instructions */
    afficherInstruction: function () {
        'use strict';
        $("#grain-alignement-messagesTitre").html("Instructions");
        $("#grain-alignement-messagesContenu").html(this.instructions[this.etape].replace("COUTOPTIMAL", this.optimal));
    },
    afficherInformation: function (text) {
        'use strict';
        $("#grain-alignement-messagesTitre").html("Informations");
        $("#grain-alignement-messagesContenu").html(text);
    },
    /** Changer d'étape */
    changerEtape: function (n) {
        'use strict';
        this.etape = n;
        this.afficherInstruction();
        $("#grain-alignement-listeEtapes li").removeClass("grain-alignement-etapeActuelle");
        $("#grain-alignement-listeEtapes li:nth-child(" + n + ")").addClass("grain-alignement-etapeActuelle");
        switch (n) {
        case 1:
            this.initEtape1();
            break;
        case 2:
            this.initEtape2();
            break;
        case 3:
            this.initEtape3();
            break;
        case 4:
            this.initEtape4();
            break;
        case 5:
            this.initEtape5();
            break;
        }
    },
    /** Initilisation Etape 1 */
    initEtape1 : function () {
        'use strict';
        /*
         * Affichage des menus
         */
        var menu = $("#grain-alignement-chemins-menu");
        menu.empty();
        menu.append('<a href="javascript:alignement.next1(1)" title="Tracer à droite"><img src="alignement/droite.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next1(2)" title="Tracer en bas"><img src="alignement/bas.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next1(3)" title="Tracer en diagonale"><img src="alignement/diagonale.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        menu.append('<a href="javascript:alignement.retour1()" title="Annuler dernier tracé"><img src="alignement/retour.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.initEtape1()" title="Réinitialiser tracé"><img src="alignement/depart.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.afficherMatrice()" title="Afficher matrice des coûts"><img src="alignement/matrice.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        /*
         * Initialisation du canvas
         */
        this.initCanvas();
        this.initScores();
        this.alignements = [];
        this.alignements.push([{x: 0, y: 0}]);
        this.posX = this.posY = 0;
        this.afficherActuel();
        this.afficherAlignements();
    },
    next1: function (dir) {
        'use strict';
        var x = this.posX,
            y = this.posY,
            xx = (dir === 2) ? x : x + 1,
            yy = (dir === 1) ? y : y + 1;
        if (xx <= this.x.length && yy <= this.y.length) {
            this.afficherTrait(x, y, xx, yy);
            this.afficherParent(x, y);
            this.posX = xx;
            this.posY = yy;
            this.scores[xx][yy] = this.scores[x][y] + this.calculCout(xx, yy, dir);
            this.alignements[0].push({x: xx, y: yy});
            this.afficherActuel();
            this.afficherAlignements();
            this.actualiserGrille();
            switch (dir) {
            case 1:
                this.afficherInformation("Insertion d'un <b>gap</b> dans la première séquence (en lignes)<br/>Coût : " + this.calculCout(xx, yy, dir));
                break;
            case 2:
                this.afficherInformation("Insertion d'un <b>gap</b> dans la seconde séquence (en colonnes)<br/>Coût : " + this.calculCout(xx, yy, dir));
                break;
            case 3:
                this.afficherInformation("Mise en correspondance du caractère " + this.x[xx - 1] + " et du caractère " + this.y[yy - 1] + " <br/>Coût : " + this.calculCout(xx, yy, dir));
                break;
            }
        }
        if (xx === this.x.length && yy === this.y.length) {
            $("#etape2").show();
        }
    },
    /** Retour */
    retour1: function () {
        'use strict';
        var j,
            alig = this.alignements[0];
        if (alig.length > 1) {
            this.canvas.removeLayerGroup("scores");
            this.canvas.removeLayerGroup("chemin");
            this.alignements[0].pop();
            for (j = 0; j < alig.length - 1; j = j + 1) {
                this.afficherParent(alig[j].x, alig[j].y);
                this.afficherTrait(alig[j].x, alig[j].y, alig[j + 1].x, alig[j + 1].y);
            }
            this.posX = alig[j].x;
            this.posY = alig[j].y;
            this.afficherActuel();
            this.actualiserGrille();
            this.afficherAlignements();
        }
    },
    initEtape2: function () {
        'use strict';
        /*
         * Affichage des menus
         */
        var menu = $("#grain-alignement-chemins-menu");
        menu.empty();
        menu.append('<a href="javascript:alignement.next2(1)"><img src="alignement/droite.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next2(2)"><img src="alignement/bas.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next2(3)"><img src="alignement/diagonale.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        menu.append('<a href="javascript:alignement.retour2()"><img src="alignement/retour.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.initEtape2()"><img src="alignement/depart.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.afficherMatrice()"><img src="alignement/matrice.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        /*
         * Initialisation du canvas
         */
        this.initCanvas();
        this.initScores();
        this.alignements = [];
        this.alignements.push([{x: 0, y: 0}]);
        this.posX = this.posY = 0;
        this.afficherActuel();
        this.afficherAlignements();
    },
    next2: function (dir) {
        'use strict';
        var x = this.posX,
            y = this.posY,
            xx = (dir === 2) ? x : x + 1,
            yy = (dir === 1) ? y : y + 1,
            score;
        if (xx <= this.x.length && yy <= this.y.length) {
            score = this.scores[x][y] + this.calculCout(xx, yy, dir);
            if (this.scores[xx][yy] === null || this.scores[xx][yy] >= score) {
                this.afficherTrait(x, y, xx, yy);
                this.afficherParent(x, y);
                this.posX = xx;
                this.posY = yy;
                this.scores[xx][yy] = this.scores[x][y] + this.calculCout(xx, yy, dir);
                this.alignements[0].push({x: xx, y: yy});
                this.afficherActuel();
                this.afficherAlignements();
                this.actualiserGrille();
                switch (dir) {
                case 1:
                    this.afficherInformation("Insertion d'un <b>gap</b> dans la première séquence (en lignes)<br/>Coût : " + this.calculCout(xx, yy, dir));
                    break;
                case 2:
                    this.afficherInformation("Insertion d'un <b>gap</b> dans la seconde séquence (en colonnes)<br/>Coût : " + this.calculCout(xx, yy, dir));
                    break;
                case 3:
                    this.afficherInformation("Mise en correspondance du caractère " + this.x[xx - 1] + " et du caractère " + this.y[yy - 1] + " <br/>Coût : " + this.calculCout(xx, yy, dir));
                    break;
                }
                if (xx === this.x.length && yy === this.y.length) {
                    if (score === this.optimal) {
                        this.afficherInformation("Bravo ! Vous avez trouvé un alignement optimal !");
                        $("#etape3").show();
                    } else {
                        this.afficherInformation("Le coût de votre alignement " + score + " est supérieur à celui de l'alignement optimal " + this.optimal + ".");
                    }
                }
            } else {
                this.afficherInformation("Le coût attaché à ce noeud " + this.scores[xx][yy] + " est inférieur au coût du chemin que vous êtes en train de tracer (" + score + ").<br/> Il est donc inutile de poursuivre ce dernier");
            }
        }
    },
    retour2: function () {
        'use strict';
        var i, j;
        this.retour1();
        for (i = 0; i <= this.x.length; i = i + 1) {
            for (j = 0; j <= this.y.length; j = j + 1) {
                if (this.scores[i][j] !== null) {
                    this.afficherScore(i, j);
                }
            }
        }
    },
    initEtape3 : function () {
        'use strict';
        /*
         * Affichage des menus
         */
        var menu = $("#grain-alignement-chemins-menu");
        menu.empty();
        menu.append('<a href="javascript:alignement.next3(-2)"><img src="alignement/debut.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next3(-1)"><img src="alignement/recul.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next3(1)"><img src="alignement/avance.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next3(2)"><img src="alignement/fin.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        menu.append('<a href="javascript:alignement.afficherMatrice()"><img src="alignement/matrice.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        /*
         * Initialisation du canvas
         */
        this.initCanvas();
        this.initScores();
        this.alignements = [];
        this.alignements.push([{x: 0, y: 0}]);
        this.posX = this.posY = 0;
        this.afficherActuel();
        this.afficherAlignements();
    },
    next3: function (n) {
        'use strict';
        if (n > 0) {
            this.afficherInformation("Calcule le coût minimal du noeud à partir des coûts calculés et attachés aux trois noeuds voisins.");
            do {
                if (this.posX !== this.x.length || this.posY !== this.y.length) {
                    this.avance3();
                } else {
                    n = 0;
                    $("#etape4").show();
                }
            } while (n === 2);
        }
        if (n < 0) {
            do {
                if (this.posX !== 0 || this.posY !== 0) {
                    this.recul3();
                } else {
                    n = 0;
                }
            } while (n === -2);
            this.canvas.removeLayerGroup("chemin");
            this.canvas.removeLayer("score_" + this.posX + "_" + this.posY);
            this.afficherActuel();
        }
        this.canvas.removeLayerGroup("couts");
        this.afficherCouts();
        this.actualiserGrille();
    },
    avance3: function () {
        'use strict';
        var x = this.posX,
            y = this.posY,
            score,
            s;
        x = x - 1;
        y = y + 1;
        if (x < 0 || y > this.y.length) { x = y + x + 1; y = 0; }
        if (x > this.x.length) { y = x - this.x.length; x = this.x.length; }
        this.posX = x;
        this.posY = y;
        this.canvas.removeLayerGroup("chemin");
        if (x > 0) {
            s = this.scores[x - 1][y] + this.calculCout(x, y, 1);
            if (score === undefined || score > s) {
                score = s;
            }
        }
        if (y > 0) {
            s = this.scores[x][y - 1] + this.calculCout(x, y, 2);
            if (score === undefined || score > s) {
                score = s;
            }
        }
        if (x > 0 && y > 0) {
            s = this.scores[x - 1][y - 1] + this.calculCout(x, y, 3);
            if (score === undefined || score > s) {
                score = s;
            }
        }
        this.scores[x][y] = score;
        this.afficherActuel();
    },
    recul3: function () {
        'use strict';
        var x = this.posX,
            y = this.posY;
        this.canvas.removeLayer("score_" + x + "_" + y);
        x = x + 1;
        y = y - 1;
        if (x > this.x.length || y < 0) { x = y + x - 1 - this.y.length; y = this.y.length; }
        if (x < 0) { y = this.y.length + x; x = 0; }
        this.posX = x;
        this.posY = y;
    },
    initEtape4 : function () {
        'use strict';
        /*
         * Affichage des menus
         */
        var menu = $("#grain-alignement-chemins-menu");
        menu.empty();
        menu.append('<a href="javascript:alignement.next4(1)"><img src="alignement/gauche.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next4(2)"><img src="alignement/haut.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next4(3)"><img src="alignement/diagonale2.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        menu.append('<a href="javascript:alignement.retour4()"><img src="alignement/retour.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.initEtape4()"><img src="alignement/depart.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.afficherMatrice()"><img src="alignement/matrice.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        /*
         * Initialisation du canvas
         */
        this.initCanvas();
        this.initScores();
        this.alignements = [];
        this.alignements.push([{x: this.x.length, y: this.y.length}]);
        this.posX = this.posY = 0;
        this.afficherActuel();
        this.afficherAlignements();
        // Affichage des scores
        while (this.posX !== this.x.length || this.posY !== this.y.length) {
            this.avance3();
        }
        this.afficherCouts();
        this.actualiserGrille();
    },
    next4: function (dir) {
        'use strict';
        var x = this.posX,
            y = this.posY,
            xx = (dir === 2) ? x : x - 1,
            yy = (dir === 1) ? y : y - 1;
        if (xx >= 0 && yy >= 0) {
            if ((this.scores[x][y] - this.calculCout(x, y, dir)).toFixed(1) === this.scores[xx][yy].toFixed(1)) {
                this.afficherTrait(x, y, xx, yy);
                this.afficherParent(x, y);
                this.posX = xx;
                this.posY = yy;
                this.alignements[0].unshift({x: xx, y: yy});
                this.afficherActuel();
                this.canvas.removeLayerGroup("couts");
                this.afficherCouts();
                this.afficherAlignements();
                this.actualiserGrille();
                this.afficherInformation("");
                if (xx === 0 && yy === 0) {
                    this.afficherInformation("Bravo, vous avez trouvé l'alignement optimal !");
                    $("#etape5").show();
                }
            } else {
                this.afficherInformation("Le noeud que vous avez selectionné ne peut pas faire partie du chemin optimal, car le coût de transition est trop élevé.<br/>" + this.scores[xx][yy] + " + " + this.calculCout(x, y, dir) + " > " + this.scores[x][y]);
            }
        }
    },
    retour4: function () {
        'use strict';
        var j,
            alig = this.alignements[0];
        if (alig.length > 1) {
            this.canvas.removeLayerGroup("chemin");
            alig.shift();
            for (j = 1; j < alig.length; j = j + 1) {
                this.afficherParent(alig[j].x, alig[j].y);
                this.afficherTrait(alig[j].x, alig[j].y, alig[j - 1].x, alig[j - 1].y);
            }
            this.posX = alig[0].x;
            this.posY = alig[0].y;
            this.afficherActuel();
            this.canvas.removeLayerGroup("couts");
            this.afficherCouts();
            this.actualiserGrille();
            this.afficherAlignements();
        }
    },
    initEtape5 : function () {
        'use strict';
        /*
         * Affichage des menus
         */
        var menu = $("#grain-alignement-chemins-menu"), i;
        menu.empty();
        menu.append('<a href="javascript:alignement.initEtape5()"><img src="alignement/debut.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next5(-1)"><img src="alignement/recul.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next5(1)"><img src="alignement/avance.png" width="20" height="20" border="0" /></a> ');
        menu.append('<a href="javascript:alignement.next5(2)"><img src="alignement/fin.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        menu.append('<a href="javascript:alignement.afficherMatrice()"><img src="alignement/matrice.png" width="20" height="20" border="0" /></a> ');
        menu.append(' &nbsp; ');
        /*
         * Initialisation du canvas
         */
        this.initCanvas();
        this.initScores();
        this.posX = this.posY = 0;
        this.afficherActuel();
        // Affichage des scores
        while (this.posX !== this.x.length || this.posY !== this.y.length) {
            this.avance3();
        }
        this.actualiserGrille();
        /*
         * Détection des chemins optimaux
         */
        this.optimaux = this.detectionOptimaux({x: this.x.length, y: this.y.length});
        this.afficherCouts();
        this.actualiserGrille();
        this.alignements = [];
        this.posM = 0;
        for (i = 0; i < this.optimaux.length; i = i + 1) {
            this.alignements.push([{x: this.x.length, y: this.y.length}]);
            this.posM = Math.max(this.posM, this.optimaux[i].length);
        }
        this.afficherAlignements();
        this.pos5 = 0;
    },
    detectionOptimaux: function (opt) {
        'use strict';
        var x = opt[opt.length - 1].x,
            y = opt[opt.length - 1].y,
            optimaux = [],
            dir,
            xx,
            yy,
            opt2;
        if (x === 0 && y === 0) {
            return [opt];
        }
        for (dir = 1; dir <= 3; dir = dir + 1) {
            xx = (dir === 2) ? x : x - 1;
            yy = (dir === 1) ? y : y - 1;
            if (xx >= 0 && yy >= 0 && (this.scores[x][y] - this.calculCout(x, y, dir)).toFixed(1) === this.scores[xx][yy].toFixed(1)) {
                opt2 = opt.slice();
                opt2.push({x: xx, y: yy});
                optimaux = optimaux.concat(this.detectionOptimaux(opt2));
            }
        }
        return optimaux;
    },
    pos5: 0,
    posM: 0,
    next5: function (n) {
        'use strict';
        if (n > 0) {
            do {
                if (this.pos5 < this.posM - 1) {
                    this.avance5();
                } else {
                    n = 0;
                }
            } while (n === 2);
        }
        if (n < 0) {
            if (this.pos5 <= 1) {
                this.initEtape5();
            } else {
                this.recul5();
            }
        }
        this.afficherAlignements();
        this.actualiserGrille();
        this.afficherInformation("Calcul du noeud (ou des noeuds) optimal parmi les trois possibles menant au noeud courant.");
    },
    avance5: function () {
        'use strict';
        var i, x, y, yy, xx, m, j, opt;
        this.pos5 = this.pos5 + 1;
        this.canvas.removeLayerGroup("couts");
        for (i = 0; i < this.optimaux.length; i = i + 1) {
            opt = this.optimaux[i];
            if (this.pos5 < opt.length) {
                x = opt[this.pos5 - 1].x;
                y = opt[this.pos5 - 1].y;
                xx = opt[this.pos5].x;
                yy = opt[this.pos5].y;
                m = Math.min(this.pos5, opt.length - 1);
                for (j = 1; j <= m; j = j + 1) {
                    this.canvas.removeLayer("score_" + opt[j - 1].x + "_" + opt[j - 1].y);
                    this.afficherParent(opt[j - 1].x, opt[j - 1].y);
                    this.afficherTrait(opt[j].x, opt[j].y, opt[j - 1].x, opt[j - 1].y);
                }
                this.afficherTrait(x, y, xx, yy);
                this.canvas.removeLayer("score_" + x + "_" + y);
                this.afficherParent(x, y);
                this.alignements[i].unshift({x: xx, y: yy});
                this.afficherCouts(xx, yy);
            }
        }
        for (i = 0; i < this.optimaux.length; i = i + 1) {
            opt = this.optimaux[i];
            if (this.pos5 < opt.length) {
                xx = opt[this.pos5].x;
                yy = opt[this.pos5].y;
                this.canvas.removeLayer("score_" + xx + "_" + yy);
                this.afficherActuel(xx, yy);
            }
        }
    },
    recul5: function () {
        'use strict';
        var i, j, opt, m, xx, yy;
        this.pos5 = this.pos5 - 1;
        this.canvas.removeLayerGroup("chemin");
        this.canvas.removeLayerGroup("couts");
        for (i = 0; i < this.optimaux.length; i = i + 1) {
            opt = this.optimaux[i];
            m = Math.min(this.pos5, opt.length - 1);
            for (j = 1; j <= m; j = j + 1) {
                this.canvas.removeLayer("score_" + opt[j - 1].x + "_" + opt[j - 1].y);
                this.afficherParent(opt[j - 1].x, opt[j - 1].y);
                this.afficherTrait(opt[j].x, opt[j].y, opt[j - 1].x, opt[j - 1].y);
            }
            if (this.pos5 < opt.length - 1) {
                xx = opt[this.pos5].x;
                yy = opt[this.pos5].y;
                this.alignements[i].shift();
                this.afficherCouts(xx, yy);
            }
        }
        for (i = 0; i < this.optimaux.length; i = i + 1) {
            opt = this.optimaux[i];
            if (this.pos5 < opt.length) {
                xx = opt[this.pos5].x;
                yy = opt[this.pos5].y;
                this.canvas.removeLayer("score_" + xx + "_" + yy);
                this.afficherActuel(xx, yy);
            }
        }
    },
    call5: function () {
        'use strict';
        var i = $(this).attr("alig");
        $("#grain-alignement-listeAlignements table").removeClass("grain-alignement-selection");
        $('#grain-alignement-listeAlignements table[alig="' + i + '"]').addClass("grain-alignement-selection");
        alignement.afficher5(i);
    },
    afficher5: function (i) {
        'use strict';
        var m, opt, j, xx, yy;
        this.canvas.removeLayerGroup("chemin");
        this.canvas.removeLayerGroup("couts");
        opt = this.optimaux[i];
        m = Math.min(this.pos5, opt.length - 1);
        for (j = 1; j <= m; j = j + 1) {
            this.canvas.removeLayer("score_" + opt[j - 1].x + "_" + opt[j - 1].y);
            this.afficherParent(opt[j - 1].x, opt[j - 1].y);
            this.afficherTrait(opt[j].x, opt[j].y, opt[j - 1].x, opt[j - 1].y);
        }
        xx = opt[m].x;
        yy = opt[m].y;
        this.afficherCouts(xx, yy);
        this.canvas.removeLayer("score_" + xx + "_" + yy);
        this.afficherActuel(xx, yy);
        this.actualiserGrille();
        this.afficherInformation("Calcul du noeud (ou des noeuds) optimal parmi les trois possibles menant au noeud courant.");
    },
    /**
     * Initialisation du grain
     */
    init: function () {
        'use strict';
        /*
         * Génération de la matrice des scores
         */
        var i, j, obj2,
            obj = $(" #grain-alignement-matrice table");
        obj.empty();
        obj2 = $('<tr></tr>');
        obj2.append("<th></th>");
        for (i = 0; i < this.lettres.length; i = i + 1) {
            obj2.append('<th>' + this.lettres[i] + '</th>');
        }
        obj.append(obj2);
        for (i = 0; i < this.lettres.length; i = i + 1) {
            obj2 = $('<tr></tr>');
            obj2.append('<th>' + this.lettres[i] + '</th>');
            for (j = 0; j < this.lettres.length; j = j + 1) {
                obj2.append('<td>' + this.couts[this.lettres[i] + this.lettres[j]] + '</td>');
            }
            obj.append(obj2);
        }
        $("#grain-alignement-matrice").addClass("grain-alignement-type-" + this.lettres.length);
        /*
         * Affichage du coût optimal
         */
        this.initEtape3();
        this.next3(2);
        for (i = 2; i <= 5; i = i + 1) {
            $("li#etape" + i).hide();
        }
        this.optimal = this.scores[this.x.length][this.y.length];
        $("#grain-alignement-optimal .grain-alignement-contenu").html(this.optimal.toFixed(1));
    },
    /**
     * Initialisation du canvas
     */
    initCanvas: function () {
        'use strict';
        var i, j, couleur, h, w;
        /*
         * Parametres du canvas
         */
        this.canvas = $("#grain-alignement-canvas");
        this.canvas.clearCanvas();
        this.canvas.removeLayers();
        h = this.canvas.innerHeight() - 60;
        w = this.canvas.innerWidth() - 60;
        this.delta = Math.min(w / (this.x.length), h / (this.y.length));
        /*
         * Affichage de la grille
         */
        couleur = this.coutGap === 0 ? "#0C0" : "red";
        //Horizontal
        for (i = 0; i <= this.x.length; i = i + 1) {
            this.afficherGrille(i, 0, i, this.y.length, couleur);
        }
        for (i = 0; i < this.x.length; i = i + 1) {
            this.canvas.drawText({layer: true, group: "lettres", fillStyle: "red", fontSize: "18px", fontFamily: "Arial", x: 40 + (i + 0.5) * this.delta, y: 14, text: this.x[i]});
        }

        //Vertical
        for (i = 0; i <= this.y.length; i = i + 1) {
            this.afficherGrille(0, i, this.x.length, i, couleur);
        }
        for (i = 0; i < this.y.length; i = i + 1) {
            this.canvas.drawText({layer: true, group: "lettres", fillStyle: "green", fontSize: "18px", fontFamily: "Arial", y: 40 + (i + 0.5) * this.delta, x: 12, text: this.y[i]});
        }
        for (i = 1; i <= this.x.length; i = i + 1) {
            for (j = 1; j <= this.y.length; j = j + 1) {
                couleur = this.calculCout(i, j, 3) === 0 ? "#0C0" : "red";
                this.afficherGrille(i - 1, j - 1, i, j, couleur);
            }
        }

        //Cercles
        for (i = 0; i <= this.x.length; i = i + 1) {
            for (j = 0; j <= this.y.length; j = j + 1) {
                this.canvas.drawEllipse({layer: true, group: "bulles", strokeStyle: "#000", strokeWidth: 1, fillStyle: "#FFF", x: 40 + i * this.delta, y: 40 + j * this.delta, width: 21, height: 21});
            }
        }
    },
    /**
     * Initialisation de la matrice de score
     */
    initScores: function () {
        'use strict';
        var i, j;
        this.scores = [];
        for (i = 0; i <= this.x.length; i = i + 1) {
            this.scores[i] = [];
            for (j = 0; j <= this.y.length; j = j + 1) {
                this.scores[i][j] = null;
            }
        }
        this.scores[0][0] = 0;
    },
    afficherTrait: function (x, y, xx, yy, couts) {
        'use strict';
        var couleur = couts ? "#F0F" : "#00F",
            groupe = couts ? "couts" : "chemin";
        this.canvas.drawLine({layer: true, group: groupe, index: 0, strokeStyle: couleur, strokeWidth: 3, x1: 40 + x * this.delta, y1: 40 + y * this.delta, x2: 40 + xx * this.delta, y2: 40 + yy * this.delta});
    },
    afficherCouts: function (x, y) {
        'use strict';
        if (x === undefined) {
            x = this.posX;
        }
        if (y === undefined) {
            y = this.posY;
        }
        if (x > 0) {
            this.afficherTrait(x - 1, y, x, y, true);
            this.afficherScore(x - 0.55, y - 0.15, this.calculCout(x, y, 1));
        }
        if (y > 0) {
            this.afficherTrait(x, y - 1, x, y, true);
            this.afficherScore(x + 0.15, y - 0.55, this.calculCout(x, y, 2));
        }
        if (x > 0 && y > 0) {
            this.afficherTrait(x - 1, y - 1, x, y, true);
            this.afficherScore(x - 0.35, y - 0.55, this.calculCout(x, y, 3));
        }
    },
    actualiserGrille: function () {
        'use strict';
        this.canvas.getLayers(function (layer) {
            if (layer.group === "grille") {
                alignement.canvas.moveLayer(layer, 0);
            }
        });
        this.canvas.clearCanvas().drawLayers();
    },
    afficherParent: function (x, y) {
        'use strict';
        this.canvas.drawEllipse({layer: true, group: "chemin", strokeStyle: "#00F", strokeWidth: 2, fillStyle: "#CC0", x: 40 + x * this.delta, y: 40 + y * this.delta, width: 21, height: 21});
        this.afficherScore(x, y);
    },
    afficherActuel: function (x, y) {
        'use strict';
        if (x === undefined) {
            x = this.posX;
        }
        if (y === undefined) {
            y = this.posY;
        }
        this.canvas.drawEllipse({layer: true, group: "chemin", strokeStyle: "#000", strokeWidth: 1, fillStyle: "#FF0", x: 40 + x * this.delta, y: 40 + y * this.delta, width: 21, height: 21});
        this.afficherScore(x, y);
    },
    afficherScore: function (x, y, s) {
        'use strict';
        var g = "couts",
            name = "score_" + x + "_" + y;
        if (s === undefined) {
            s = this.scores[x][y];
            g = "scores";
        }
        this.canvas.drawText({layer: true, name: name, group: g, fillStyle: "#000", fontSize: "11px", fontFamily: "Arial", x: 40 + x * this.delta, y: 40 + y * this.delta, text: s.toFixed(1)});
    },
    afficherGrille: function (x, y, xx, yy, couleur) {
        'use strict';
        this.canvas.drawLine({layer: true, group: "grille", strokeStyle: couleur, strokeWidth: 1, x1 : 40 + x * this.delta, y1: 40 + y * this.delta, x2: 40 + xx * this.delta, y2: 40 + yy * this.delta});
    },
    afficherAlignements: function () {
        'use strict';
        var i, j, l, ll, alig, obj2,
            obj = $("#grain-alignement-listeAlignements").empty();
        for (i = 0; i < this.alignements.length; i = i + 1) {
            alig = this.alignements[i];
            l = "";
            ll = "";
            for (j = 1; j < alig.length; j = j + 1) {
                l  += '<td>' + ((alig[j].y === alig[j - 1].y) ? "-" : this.y[alig[j].y - 1]) + '</td>';
                ll += '<td>' + ((alig[j].x === alig[j - 1].x) ? "-" : this.x[alig[j].x - 1]) + '</td>';
            }
            obj2 = $('<table><tr>' + l + '</tr><tr>' + ll + '</tr></table>');
            if (this.etape === 5) {
                obj2.click(alignement.call5);
                obj2.attr("alig", i);
                obj2.addClass("grain-alignement-pointer");
            }
            obj.append(obj2);
        }
    },
    afficherMatrice: function () {
        'use strict';
        $(" #grain-alignement-matrice ").toggle();
    },
    /** Calcul du cout pour un déplacement */
    calculCout: function (x, y, dir) {
        'use strict';
        if (dir !== 3) {
            return this.coutGap;
        }
        return this.couts[this.x[x - 1] + this.y[y - 1]];
    }
};

/*
 * Liste des messages
 */
alignement.messages[1] = {titre: "Alignement courant", contenu: "L'alignement courant correspond au chemin que vous êtes en train de tracer.<br/> Le caractère \"-\" représente l'insertion d'un gap dans la séqence."};
alignement.messages[2] = {titre: "Coût optimal", contenu: "Le coût d'un chemin est la somme des coûts de transition d'un nœud à son suivant ; autrement dit, la somme des coûts de subsitution et d'insertion de gaps."};

/*
 * Liste des instructions
 */
alignement.instructions[1] = "<b>Objectif</b> : tracer un chemin correspondant à un alignement de séquences et comparer son coût avec le coût optimal.<br><br>"
    + "<b>Explications</b> : le tracé part du nœud origine (en haut à gauche) de la grille. Pour débuter le tracé d’un chemin, choisir l'une des trois directions possibles à l’aide des flèches en haut du cadre <b>Chemins</b>. Ce tracé détermine simultanément un alignement partiel affiché dans le cadre <b>Alignement courant</b>.<br>"
    + "Le dernier nœud choisi s'affiche en jaune avec l'indication du coût de l'alignement partiel correspondant.</br>"
    + "Quand vous atteignez le nœud terminal (en bas à droite de la grille), vous avez déterminé un alignement des deux séquences.</br>"
    + "Comparer le coût de cet alignement avec le coût optimal qui apparaît ci-contre, dans le cadre <b>Coût optimal</b>.<br>"
    + "Vous pouvez revenir sur l'un des nœuds du chemin en cliquant sur la flèche orange retour et choisir une autre direction pour tenter d'obtenir un meilleur alignement.<br>Vous pouvez réinitialiser le chemin en cliquant sur la double flèche orange.";
alignement.instructions[2] = "<b>Objectif</b> : Tracer un chemin possédant le coût optimal 3.<br><br>"
    + "<b>Astuce</b> : pour vous aider à déterminer un alignement optimal, le coût du chemin choisi s’affiche sur le nœud d’arrivée et cet affichage est maintenu quand vous décidez de revenir sur un nœud précédent (flèche retour orange) pour choisir une autre direction. Vous pouvez ainsi constater facilement si vous êtes en mesure d'améliorer un coût précédemment obtenu.";
alignement.instructions[3] = "<b>Objectif</b> : Suivre pas à pas la première phase de l’algorithme.<br><br>"
    + "<b>Explications</b> : Cliquer sur les flèches vertes du cadre Chemins pour suivre la progression de l’algorithme qui calcule les coûts des chemins optimaux arrivant à chaque nœud de la grille.";
alignement.instructions[4] = "<b>Objectif</b> : Retrouver le ou les alignements optimaux en partant du nœud terminal.<br><br>"
    + "<b>Explications</b>: Partir du nœud terminal (en bas à droite de la grille) et remonter au nœud origine (en haut à gauche) en choisissant à chaque fois (à l’aide des flèches du cadre Chemins) un nœud précédent dont le coût est compatible avec l'optimalité du nœud courant.";
alignement.instructions[5] = "<b>Objectif</b> : Suivre pas à pas la première phase de l’algorithme.<br><br>"
    + "<b>Explications</b> : Cliquer sur les flèches vertes du cadre Chemins pour suivre la seconde phase de l’algorithme.<br>"
    + "Suivre plus particulièrement les étapes où plusieurs nœuds peuvent être choisis, reflétant l’existence de plusieurs alignements optimaux, donc de même coût.";
