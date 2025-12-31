package main

import (
	"log"
	"os"
)

func main() {
	log.SetOutput(os.Stdout)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	log.Println("Hardware Controller Server starting...")
	// TODO: implement server
}
