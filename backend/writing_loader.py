import os
import frontmatter
import markdown

WRITING_DIR = os.path.join(os.path.dirname(__file__), "writing")


def load_posts():
    posts = []

    for filename in os.listdir(WRITING_DIR):
        if not filename.endswith(".md"):
            continue

        path = os.path.join(WRITING_DIR, filename)
        post = frontmatter.load(path)

        html = markdown.markdown(post.content)

        posts.append({
            "slug": filename.replace(".md", ""),
            "title": post.get("title"),
            "date": post.get("date"),
            "summary": post.get("summary"),
            "content": html,
        })

    return sorted(posts, key=lambda p: p["date"], reverse=True)
