---
{
  "title": "Run Angular on Github Pages",
  "timestamp": 1679374250000,
  "tags": ["angular", "github pages"]
}
---

[GitHub Pages](https://pages.github.com/) is a static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository on GitHub.

You can use [Angular](https://angular.io/) to build your pages, but there are a couple of hacks that you have to know when deploying.

Once you are ready you can build as usual using `ng build`.
At this point you are ready to copy the `dist/<project>` folder to your repository.

If you try to navigate to `https://<project>.github.io/` everything will seem to work.
Unfortunately if you try to go directly to a route _(from the url)_ e.g. `https://<project>.github.io/my-page` you will see a 404 not found page.

To workaround this problem, the simple solution is to create a copy of the index.html and call it **404.html**.
Once your page is deployed you can try again the url `https://<project>.github.io/my-page` and the page will load without problem.
What happens behind the scenes is that github pages tries to lookup a file called /my-page inside the repo.
if the file does not exists will try to fall back to a file called 404.html. which allows you to implement custom "404 pages".
But since angular has a single entry point the index.html copying the index.html as 404.html will more or less like a redirect,
so we are able to load every url directly.

Even if the page will be loaded correctly from the browser and everything it will seem to work,
the 404 page will be server with *http status 404*, so crawlers or other system will think that the page does not exists.

A solution is to use the Angular [HashLocationStrategy](https://angular.io/api/common/HashLocationStrategy),
which is a LocationStrategy used to configure the Location service to represent its state in the hash fragment of the browser's URL.

Which means that if your url will switch from `https://<project>.github.io/my-page` to `https://<project>.github.io/#/my-page`.
With this trick if you load the url directly, it will always load the index.html.

The only change you have to make is to use the hash strategy. To do that just add the `{ useHash: true }` argument
to the RouterModule.forRoot() of your app-routing.module.ts

```typescript
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

That's it, now your pages will always load with the expected 200 OK status code.

_If you want to keep both type of urls /#/my-page and /my-page, what you can do is build twice,
once with the useHash: true to generate the index.html and once with the useHash: false, and rename the generated index.html as 404.html.
In this way you will be able to use both type of urls directly, knowing that the one without the hash /my-page will load with a 404 status code._