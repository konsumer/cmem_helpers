#include "walloc.h"
#include <string.h>

typedef struct Color {
  unsigned char r;
  unsigned char g;
  unsigned char b;
  unsigned char a;
} Color;

// exports
void test1(char* name, char* destination) {
  strcpy(destination, "Hello ");
  strcat(destination, name);
}

void test2(Color* color) {
  color->a = 100;
}