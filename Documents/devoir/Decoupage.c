#include <stdio.h>
#include <stdlib.h>

// === Fonction pour découper une image PPM ===
void decouper_ppm(const char *fichier_source, const char *fichier_resultat, 
                  int l1, int l2, int c1, int c2) {

    FILE *src = fopen(fichier_source, "r");
    if (!src) {
        printf(" Erreur : impossible d'ouvrir %s\n", fichier_source);
        return;
    }

    char format[3];
    int largeur, hauteur, max;

    fscanf(src, "%2s", format);
    fscanf(src, "%d %d", &largeur, &hauteur);
    fscanf(src, "%d", &max);

    if (l1 < 0 || l2 > hauteur || c1 < 0 || c2 > largeur || l1 >= l2 || c1 >= c2) {
        printf(" Coordonnées invalides !\n");
        fclose(src);
        return;
    }

    int total_pixels = largeur * hauteur;
    unsigned char *pixels = malloc(total_pixels * 3);
    if (!pixels) {
        printf(" Erreur d'allocation mémoire\n");
        fclose(src);
        return;
    }

    for (int i = 0; i < total_pixels * 3; i++) {
        fscanf(src, "%hhu", &pixels[i]);
    }
    fclose(src);

    int new_largeur = c2 - c1;
    int new_hauteur = l2 - l1;

    FILE *res = fopen(fichier_resultat, "w");
    if (!res) {
        printf("Erreur : impossible de créer %s\n", fichier_resultat);
        free(pixels);
        return;
    }

    fprintf(res, "%s\n%d %d\n%d\n", format, new_largeur, new_hauteur, max);

    for (int ligne = l1; ligne < l2; ligne++) {
        for (int col = c1; col < c2; col++) {
            int idx = (ligne * largeur + col) * 3;
            fprintf(res, "%d %d %d ", pixels[idx], pixels[idx+1], pixels[idx+2]);
        }
        fprintf(res, "\n");
    }

    fclose(res);
    free(pixels);
    printf("Découpage réussi ! Résultat enregistré dans %s\n", fichier_resultat);
}
