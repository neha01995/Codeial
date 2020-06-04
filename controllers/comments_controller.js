const Comment=require('../models/comment');
const Post=require('../models/post');
const Like = require('../models/like');
const commentsMailer=require('../mailers/comment_mailers');
const commentEmailWorker=require('../workers/comment_email_worker');
const queue=require('../config/kue');

module.exports.create=async function(req,res){
    try{
        let post=await Post.findById(req.body.post);
            // console.log(req.body.post);
            // console.log(req.body);
            if(post){
                let comment= await Comment.create({
                    content:req.body.content,
                    post:req.body.post,
                    user:req.user._id
                });
                    // handle error
                post.comments.push(comment);
                post.save()
                comment=await comment.populate('user','name email').execPopulate();
                // commentsMailer.newComment(comment);
          
                let job=queue.create('emails',comment).save(function(err){
                if(err){
                    console.log('error in sending to the queue',err);
                    return;
                     }
                console.log('job enqueued',job.id);
                    })
                    if(req.xhr){
                        return res.status(200).json({
                            data:{
                                comment:comment
                            },
                            message:"Post created"
                        });
                    }
                    req.flash('success','comment published');
                    return res.redirect('back');
                
            }else{
                req.flash('success','comment deleted');
                return res.redirect('back');

            }
    }catch(err){
        console.log('Error',err);
        return;
    }
 
}

module.exports.destroy= async function(req,res){
    try{
        let comment=await Comment.findById(req.params.id);
            if(comment.user==req.user.id){
                let postId=comment.post;
                comment.remove();
                let post=Post.findByIdAndUpdate(postId,{$pull:{comments:req.params.id}});
                
                //destroy the associated like for this comment
                await Like.deleteMany({likeable:comment._id,onModel:'Comment'});

                //send the comment id which was deleted back to the views
                if(req.xhr){
                    return res.status(200).json({
                        data:{
                            comment_id:req.params.id
                        },
                        message:"Post deleted"
                    });
                }
                    
                    return res.redirect('back');
                
        }else{
                return res.redirect('back');
            }

     }catch(err){
        console.log('Error',err);
        return;
    }

}

// module.exports.destroy=function(req,res){
//     Comment.findById(req.params.id, function(err,comment){
//         if(comment.user==req.user.id){
//             let postId=comment.post;
//             comment.remove();
//             Post.findByIdAndUpdate(postId, {$pull:{comments:req.params.id}} ,function(err,post){
//                 return res.redirect('back');
//             })
//         }else{
//             return res.redirect('back');

//         }


//     });
// }