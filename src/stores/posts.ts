import { readable } from "svelte/store";
import { loadAllPosts } from "../lib/postLoader";

export const posts = readable<any[]>([], (set) => {
	loadAllPosts().then((data) => {
		set(data);
	});
});
