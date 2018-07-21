# Professional Images

[example](https://professionalimages.herokuapp.com/500x500.jpg)

Add professional placeholder images to your site with this easy-to-launch service. Can launch it on Heroku.

```
git clone https://github.com/mickwilliams/professional-images.git
cd professional-images
heroku create professionalimages
heroku git:remote -a professionalimages
sh buildpack.sh
```

There you go.

Source images are located in the `corpus` directory. Any image in that directory will be used at random.

## Will it work if I replace the existing images?

Answer: It might work, but there are no guarantees. You should probably leave the existing image files just to be sure. Why do you want to replace them?
